# State Court Data Sources
*Research compiled June 2026 — for the RedHanded criminal justice data project*

---

## Overview

This document catalogs available state-level court data sources for **California, Texas, Florida, New York, and Illinois** — covering court records, bail/pretrial data, recidivism, plea deals, sentencing, and related datasets. Also includes major national aggregators.

**Feasibility ratings:** 🟢 Easy | 🟡 Medium | 🔴 Hard

---

## NATIONAL DATA SOURCES

These cut across all five states and should be acquired regardless of which state you tackle first.

### Bureau of Justice Statistics (BJS)
- **URL:** https://bjs.ojp.gov/topics/recidivism-and-reentry
- **Recidivism Program:** https://bjs.ojp.gov/recidivism-program
- **What it has:** Multi-state longitudinal recidivism studies; links prisoner records with FBI Interstate Identification Index criminal histories; demographics, admission/release dates, commitment offenses, sentence lengths
- **Data format:** Published reports + downloadable datasets via ICPSR (Inter-university Consortium for Political and Social Research)
- **NIBRS API:** https://bjs.ojp.gov/national-incident-based-reporting-system-nibrs-national-estimates-api — REST API (Socrata SODA) for national crime incident estimates
- **BJS Data Tools:** https://bjs.ojp.gov/data/data-analysis-tools — Socrata Open Data API (SODA)
- **Cost:** Free
- **Feasibility:** 🟢 Easy (for aggregated) / 🟡 Medium (for microdata via ICPSR)
- **Notes:** BJS does NOT publish state-by-state individual-level microdata publicly; their cohort studies cover states in aggregate. ICPSR has restricted microdata requiring researcher registration.

### FBI Crime Data Explorer (UCR/NIBRS)
- **URL:** https://cde.ucr.cjis.gov/
- **GitHub API:** https://github.com/fbi-cde/crime-data-api
- **What it has:** Arrests, offenses, clearances by state, agency, offense type; NIBRS incident-level data (offender, victim, property details)
- **Data format:** REST API + bulk downloads; all 50 states now NIBRS-certified
- **Cost:** Free
- **Feasibility:** 🟢 Easy
- **Notes:** Best for crime and arrest data by state/agency. Does NOT have court dispositions, sentences, or bail data.

### CourtListener / Free Law Project
- **URL:** https://www.courtlistener.com/help/api/
- **Bulk Data:** https://www.courtlistener.com/help/api/bulk-data/
- **REST API:** https://www.courtlistener.com/help/api/rest/
- **What it has:** State and federal case law (opinions), PACER federal dockets via RECAP Archive, judge profiles, oral arguments
- **Data format:** CSV bulk downloads + REST API (free, no key required at low volume)
- **Cost:** Free (bulk CSV) / Nominal for high-volume API
- **Feasibility:** 🟢 Easy
- **Notes:** Strong for appellate opinions and federal dockets. Weaker for trial-level state criminal data (charges, sentences, bail). Good for legal research context.

### Measures for Justice (MFJ)
- **URL:** https://app.measuresforjustice.org/portal
- **What it has:** County-level criminal justice performance metrics from arrest through post-conviction; covers all 5 target states. 21+ measures including prosecution rates, plea rates, sentence types, recidivism proxies
- **Coverage:** 40+ states, hundreds of counties; California, Texas, Florida, NY, IL all represented
- **Data format:** Web portal (interactive); CSV downloads for some datasets; methodology at https://measuresforjustice.org/portal/methodology
- **Cost:** Free for portal; some data requires registration; bulk data available via research partnership
- **Feasibility:** 🟢 Easy (portal) / 🟡 Medium (raw bulk data)
- **Notes:** **This is one of the most useful sources for cross-county plea deal and sentencing comparison data.** They've already done much of the aggregation work.

### Vera Institute of Justice
- **GitHub:** https://github.com/vera-institute/incarceration-trends
- **NY Data Hub:** https://www.vera.org/ny-data-hub
- **What it has:** Incarceration Trends Dataset (county-level jail/prison pop, 1970–present); bail reform data (especially NY); pretrial detention rates
- **Data format:** CSV/Excel bulk downloads on GitHub; portal for NY-specific data
- **Cost:** Free
- **Feasibility:** 🟢 Easy
- **Notes:** Vera's incarceration trends dataset is comprehensive and well-documented. NY bail reform data is particularly rich (see NY section).

### Prison Policy Initiative (PPI)
- **Data Toolbox:** https://www.prisonpolicy.org/data/
- **Data Sources Guide:** https://www.prisonpolicy.org/trainings/datasources.html
- **What it has:** Curated collection of criminal justice datasets; state-level incarceration, race/ethnicity breakdowns, probation/parole, recidivism summaries
- **Data format:** Reports + links to primary sources; some downloadable datasets
- **Cost:** Free
- **Feasibility:** 🟢 Easy
- **Notes:** Best used as a directory/index to other primary data sources. Not a raw data provider itself but an excellent research guide.

### The Sentencing Project
- **State Data Tool:** https://www.sentencingproject.org/research/detailed-state-data-tool/
- **US Criminal Justice Data:** https://www.sentencingproject.org/research/us-criminal-justice-data/
- **What it has:** State-level incarceration rates, racial disparities, felony disenfranchisement, life sentence data (collected directly from state DOCs)
- **Data format:** Interactive tool + downloadable datasets
- **Cost:** Free
- **Feasibility:** 🟢 Easy
- **Notes:** Sentencing data collected 2003–2024 from all states. Good for comparative analysis across all 5 target states.

### National Center for State Courts (NCSC) — Court Statistics Project
- **URL:** https://www.ncsc.org/our-centers-projects/court-statistics-project
- **Interactive Data:** https://www.ncsc.org/explore-court-caseload-data
- **Data.gov Archive:** https://catalog.data.gov/dataset/state-court-statistics-series-a021b
- **What it has:** Annual state trial and appellate court caseloads by case type for all 50 states + DC; felony, misdemeanor, civil, family breakdowns
- **Data format:** Interactive dashboards + downloadable reports; historical data via BJS/ICPSR
- **Cost:** Free
- **Feasibility:** 🟢 Easy
- **Notes:** Best source for AGGREGATE caseload statistics. Does NOT have individual case records.

### Data Collaborative for Justice (DCJ)
- **URL:** https://datacollaborativeforjustice.org/
- **Cook County Dashboard:** https://dashboard.datacollaborativeforjustice.org/cccptree/
- **What it has:** Research group that works with county prosecutors on open data; has analyzed Cook County (IL), Manhattan DA data, and others
- **Feasibility:** 🟡 Medium (requires contacting them for datasets)

---

## CALIFORNIA

### Court System Overview
California uses a decentralized Superior Court system — **58 county Superior Courts**, each managing their own case management systems. There is NO unified statewide case-level API. The Judicial Council publishes aggregate statistics only.

**Major case management systems used by CA counties:**
- Tyler Technologies Odyssey (some counties)
- Sustain/eCourtSystem (Los Angeles)
- Proprietary county systems (many)

### 1. Court Records

#### California Judicial Council — Court Statistics
- **URL:** https://courts.ca.gov/news-reference/research-data/court-statistics
- **2024 Report PDF:** https://courts.ca.gov/sites/default/files/courts/default/2024-12/2024-court-statistics-report.pdf
- **What it has:** Annual statewide summary — felony/misdemeanor filings, dispositions, 10-year trends; broken down by county
- **Data format:** PDF report; aggregate only
- **Cost:** Free
- **Feasibility:** 🟡 Medium (aggregate PDF, needs extraction; no raw case data)

#### Public Records Request (Case-Level Data)
- **URL:** https://oag.ca.gov/research-services/request-process
- **What it has:** Individual court records are held at the county level; for statewide aggregated or de-identified data, the DOJ processes formal requests
- **Cost:** Varies (can be free for de-identified); may require formal CPRA (California Public Records Act) request
- **Feasibility:** 🔴 Hard (fragmented, county-by-county)

#### Sacramento Superior Court Public Access
- **URL:** https://services.saccourt.ca.gov/PublicCaseAccess/
- **What it has:** Search by name or case number for Sacramento County cases; civil, criminal, family
- **Data format:** Web interface only; no bulk download
- **Feasibility:** 🔴 Hard (scraping only)

#### UniCourt (commercial aggregator)
- **URL:** https://unicourt.com/courts/state-california
- **What it has:** Aggregated CA Superior Court data across many counties
- **Cost:** **Paid** — commercial API/service
- **Feasibility:** 🟡 Medium (paid)

#### DocketAlarm
- **GitHub:** https://github.com/DocketAlarm/state-court-bulk-docket-pull
- **What it has:** API to pull state and federal court dockets in bulk using case numbers
- **Cost:** **Paid** commercial service
- **Feasibility:** 🟡 Medium (paid, requires case numbers)

### 2. Bail / Pretrial Data

California does not publish a centralized statewide pretrial release dataset. AB 1403 (2018) ended cash bail but was itself overturned by Proposition 25 (2020), which reinstated the cash bail system. County-level pretrial services data exists but is fragmented.

- **No statewide pretrial API exists** — data is held by county probation departments
- **Los Angeles County:** Some pretrial data through LA County Open Data portal (https://data.lacounty.gov/)
- **San Francisco:** SF Open Data has some criminal justice datasets (https://datasf.org/opendata/)
- **Feasibility:** 🔴 Hard (county-by-county requests)

### 3. Recidivism Data

#### California Department of Corrections and Rehabilitation (CDCR)
- **Recidivism Dashboard:** https://www.cdcr.ca.gov/research/offender-outcomes-characteristics/offender-recidivism/
- **Research Reports:** https://www.cdcr.ca.gov/about-cdcr/reports/
- **Offender Data Points:** https://www.cdcr.ca.gov/research/offender-outcomes-characteristics/offender-data-points/
- **What it has:** 3-year recidivism rates (arrest, conviction, return to prison) by offense type, gender, ethnicity; population data points (demographics, sentence length, parole population)
- **Data format:** PDF reports and Excel tables; recidivism dashboard is interactive
- **Cost:** Free
- **Feasibility:** 🟢 Easy
- **Notes:** CDCR tracks state prison releases only; does not capture re-offense without prison return. Quarterly updates.

### 4. Plea Deal Records

California does not publish statewide plea deal data. Aggregate data is implied in court statistics reports (guilty pleas vs. trial convictions).

- **Judicial Council Report:** Contains aggregate "dispositions" — plea, trial, dismissed — but not individual case-level data
- **Research access:** Formal CPRA or research agreement required for individual-level data
- **Feasibility:** 🔴 Hard

### 5. Sentencing Guidelines

**California does NOT have traditional sentencing guidelines.** Instead, it uses:
- **Determinate Sentencing Law (DSL)** — legislature sets fixed triad sentences (low/mid/high) per offense
- **California Penal Code** defines ranges; judges pick from triads
- No guidelines commission; sentencing commission proposed but not enacted

- **CDCR reports average sentence lengths** in Offender Data Points reports
- **US Sentencing Commission (Federal):** https://www.ussc.gov/research/data-reports/geography/2024-federal-sentencing-statistics — CA federal sentencing stats (FY2024: 4,482 federal cases from CA)
- **Feasibility:** 🟡 Medium (individual state data requires extraction from reports)

### California — Existing Research Projects
- Stanford Justice Advocacy Project (law.stanford.edu)
- ACLU California — sentencing reform data
- Berkeley Law Policy Advocacy Clinic
- Data from BJS multi-state studies includes CA cohorts

---

## TEXAS

### Court System Overview
Texas has a **complex, multi-tiered court structure** with no unified statewide case management system. Courts use various systems; the Office of Court Administration (OCA) collects aggregate statistics. re:SearchTX is the statewide e-filing portal.

### 1. Court Records

#### Texas Judicial Branch (OCA) — Judicial Data
- **URL:** https://www.txcourts.gov/judicial-data/
- **Statistics Portal:** https://www.txcourts.gov/statistics/
- **Annual Statistical Report:** Published each year covering all courts
- **What it has:** Case filing counts, dispositions, pending caseloads by court type and county; felony, misdemeanor, civil, family; 
- **Data format:** PDF reports + some downloadable Excel/CSV
- **Cost:** Free
- **Feasibility:** 🟡 Medium (aggregate; no individual case records publicly)

#### re:SearchTX (e-filing portal)
- **URL:** https://www.soah.texas.gov/search-case-files (SOAH usage)
- **What it has:** Online repository of court case information from state e-filing database; registered users can search dockets
- **Data format:** Web interface; no public bulk download
- **Feasibility:** 🔴 Hard (scraping or individual case lookup only)

#### Texas State Law Library — Court Records Guide
- **URL:** https://guides.sll.texas.gov/court-records
- **What it has:** Comprehensive guide to finding TX and federal court records
- **Feasibility:** 🟢 Easy (as a research directory)

### 2. Bail / Pretrial Data — ⭐ NOTABLE

**Texas has one of the most transparent bail data portals of all 5 states**, mandated by SB 9 (2021).

#### Texas OCA — Bail & Pretrial Statistics Dashboards
- **URL:** https://www.txcourts.gov/bail/statistics-dashboards/
- **Main Bail Page:** https://www.txcourts.gov/bail/
- **What it has:** Statewide and county-level bail proceedings data, Public Safety Report System (PSRS) data; aggregated bail statistics for trend analysis; charitable bail org data
- **Legal basis:** Texas Government Code §71.0351(b) — OCA required to publish bail/pretrial data publicly
- **Data format:** Dashboards (Tableau/Power BI); downloadable data available
- **Cost:** Free
- **Feasibility:** 🟢 Easy
- **Notes:** The **Public Safety Report System (PSRS)** is now live — it tracks pretrial risk assessment, release conditions, compliance. Judges must use PSRS before setting bail. This is fresh, detailed, and publicly accessible data.

### 3. Recidivism Data

#### Texas Department of Criminal Justice (TDCJ)
- **Statistics Page:** https://www.tdcj.texas.gov/statistics/index.html
- **Statistical Reports:** https://www.tdcj.texas.gov/publications/statistical_reports.html
- **FY2024 Report:** https://www.tdcj.texas.gov/documents/Statistical_Report_FY2024.pdf
- **What it has:** Annual statistical reports with offender demographics, admissions, releases, sentence lengths, parole, supervision; recidivism rates
- **Data format:** PDF reports (annual); some tabular data
- **Cost:** Free
- **Feasibility:** 🟡 Medium (PDF extraction needed for structured data)
- **Notes:** TDCJ tracks recidivism as re-incarceration rates. Does not have public individual-level data; aggregate tables only.

### 4. Plea Deal Records

No statewide plea deal database is publicly accessible. OCA statistics reports include guilty plea counts in aggregate.

- **Annual Statistical Report** (txcourts.gov/statistics/) shows plea vs. trial dispositions by court type
- **Individual case data:** Requires county clerk access; no bulk download exists
- **Feasibility:** 🔴 Hard

### 5. Sentencing Guidelines

**Texas does NOT use structured sentencing guidelines.** Texas uses:
- **Penal Code offense grades** (Class A/B/C misdemeanors; State Jail Felony; 1st–3rd degree felonies; capital)
- Each grade has a statutory range; judges have broad discretion within ranges
- **No sentencing guidelines commission**
- Punishment ranges in Texas Penal Code §12: https://statutes.capitol.texas.gov/docs/pe/pdf/pe.12.pdf

- **TDCJ Annual Report** shows average sentence lengths by offense type
- **US Sentencing Commission** has Texas federal sentencing statistics separately
- **Feasibility:** 🟡 Medium (statutory ranges easy; actual practice data requires extraction)

### Texas — Existing Research Projects
- Texas Criminal Justice Coalition (texascjc.org) — analysis of TDCJ data
- Texas Public Policy Foundation
- UT Austin School of Law — various sentencing studies

---

## FLORIDA

### Court System Overview
Florida has **20 Judicial Circuits** with county-level Clerks of Courts. The Florida Supreme Court's AOSC (Administrative Order) framework mandates electronic records access. Florida has some of the **best public access to county-level court data** of all 5 states, with multiple county APIs.

### 1. Court Records — ⭐ NOTABLE

#### Broward County Clerk of Courts — API
- **URL:** https://www.browardclerk.org/Web2/Services/AboutAPI
- **What it has:** High-volume API for 17th Judicial Circuit court records; criminal, civil, traffic, family
- **Data format:** REST API
- **Cost:** Registration required; no public pricing listed (may be free for qualified users)
- **Feasibility:** 🟢 Easy (once registered)

#### Miami-Dade County Clerk — Commercial Data Services + API
- **Bulk Data:** https://www.miamidadeclerk.gov/clerk/commercial-data-services.page
- **Developer API:** https://www2.miamidadeclerk.gov/Developers/Help
- **What it has:** Bulk data folder downloads (requires notarized registration); developer API for case metadata retrieval
- **Data format:** Bulk downloads + REST API
- **Cost:** Registration + identity verification required; bulk data has fees
- **Feasibility:** 🟡 Medium (registration and ID verification required)

#### Citrus County Clerk — Bulk Data (FREE)
- **URL:** https://www.citrusclerk.org/186/Court-Records-Search-SCORSS
- **What it has:** Filings and dispositions by date range; bulk data at no charge per FL Supreme Court order
- **Data format:** Downloadable (CSV/Excel)
- **Cost:** Free
- **Feasibility:** 🟢 Easy

#### Florida Courts — Statistics Portal
- **URL:** https://www.flcourts.gov/Publications-Statistics/Statistics
- **What it has:** Statewide and circuit-level court statistics; caseload trends
- **Cost:** Free
- **Feasibility:** 🟢 Easy

#### Florida Courts E-Filing Portal
- **URL:** https://www.myflcourtaccess.com/ (public portal)
- **What it has:** Case lookup by name/case number statewide
- **Feasibility:** 🔴 Hard (web UI only; no bulk access)

### 2. Bail / Pretrial Data

Florida lacks a centralized statewide pretrial database comparable to Texas's PSRS.

- **County Jails:** https://dos.fl.gov/library-archives/research/florida-information/government/local-resources/county-jails-and-inmate-searches/ — links to all county jail inmate search portals
- **Individual county pretrial services:** Miami-Dade, Broward, Orange, Hillsborough counties each have pretrial services programs with some data published
- **Florida Statistical Analysis Center (FSAC/FDLE):** https://www.fdle.state.fl.us/CJAB/FSAC — publishes some pretrial and sentencing reports
- **Feasibility:** 🔴 Hard (no central source; county-by-county)

### 3. Recidivism Data — ⭐ NOTABLE

#### Florida Department of Corrections (FDC)
- **Recidivism Page:** https://www.fdc.myflorida.com/pub/recidivism
- **Statistics Index:** http://prod.fdc-wpws001.fdc.myflorida.com/pub/index.html
- **OBIS Database Public Records:** https://www.fdc.myflorida.com/statistics-and-publications/public-records-requests-for-the-obis-database
- **What it has:** 
  - **Quarterly Recidivism and Admissions Statistics** — updated quarterly
  - **Complete OBIS (Offender Based Information System) Database** — public records request process; downloadable bulk data
  - Inmate mortality data; county detention facility populations
- **Data format:** PDF reports + bulk CSV/database via public records request
- **Cost:** Free (reports); nominal fee possible for full OBIS bulk download
- **Feasibility:** 🟡 Medium (OBIS requires formal request; quarterly reports are easy)
- **Notes:** Florida's FDC has some of the most accessible DOC data of the 5 states. The OBIS bulk data is particularly valuable — it contains individual-level offense, sentence, and supervision data.

#### BJS Florida Partnership
- BJS Data.gov entry notes a Florida-specific BJS cohort study: https://catalog.data.gov/dataset?tags=recidivism
- "In partnership with the Florida Department of Corrections (FDC), this study collected prison administrative data to create person-level cohort-analysis files"
- **Feasibility:** 🟡 Medium (via ICPSR)

### 4. Plea Deal Records

- **FDC** tracks conviction data; individual-level conviction offense (may differ from charge) is in OBIS
- **Florida FDLE — Computerized Criminal History (CCH):** https://www.fdle.state.fl.us/CJAB/FSAC/CCH — fingerprint-based repository of arrest and disposition data from all FL agencies; not publicly downloadable but FDLE publishes statistics from it
- **Feasibility:** 🟡 Medium (FDLE stats available; individual records require formal request)

### 5. Sentencing Guidelines — ⭐ NOTABLE

**Florida HAS a structured sentencing guidelines system** — one of the few states with a comprehensive scoresheet.

- **Florida Criminal Punishment Code Scoresheet:** Each defendant gets a numerical score based on primary offense, additional offenses, prior record, legal status, injury, etc. The score determines minimum prison sentence.
- **Criminal Punishment Code Manual (Florida Supreme Court):** Available at supremecourt.flcourts.gov
- **FDLE/FSAC:** Publishes sentencing statistics using the scoresheet
- **Feasibility:** 🟡 Medium (guidelines exist and are published; sentence-level data requires OBIS/FDLE)

### Florida — Existing Research Projects
- Florida Policy Institute
- Justice Policy Institute — FL analyses
- BJS Florida DOC partnership study (see above)

---

## NEW YORK

### Court System Overview
New York has a **Unified Court System (UCS)** — one of the most centralized state court systems. The Office of Court Administration (OCA) maintains statewide data. New York City also has the separate NYC Criminal Justice Agency (CJA). Post-2019 bail reform law created detailed data reporting mandates.

### 1. Court Records

#### NY Courts E-Courts (Criminal/Civil)
- **URL:** https://iapps.courts.state.ny.us/webcivil/ecourtsMain
- **What it has:** Future appearance dates for criminal and family court cases; active and disposed cases in civil/local courts; eTrack case tracking service
- **Data format:** Web interface only; no bulk API
- **Feasibility:** 🔴 Hard (web UI only)

#### NYSCEF (NY State Courts Electronic Filing)
- **URL:** https://iapps.courts.state.ny.us/nyscef/CaseSearch
- **What it has:** Electronically filed court documents (Supreme Court civil); case search
- **Data format:** Web interface; no public bulk download
- **Feasibility:** 🔴 Hard

### 2. Bail / Pretrial Data — ⭐⭐ BEST IN CLASS

New York has the most comprehensive and accessible pretrial data of all 5 states, driven by the 2019 bail reform law.

#### NY Courts — Pretrial Release Data (CSV Downloads)
- **URL:** https://ww2.nycourts.gov/pretrial-release-data-33136
- **What it has:** State-paid court data for city, district, and superior courts; **CSV downloads by arraignment year (2020–2025)**; case information, demographics, arrest type, release status, bail set, prior conviction history, bench warrants, and rearrests
- **Data format:** CSV (28 fields per case); updated bi-annually
- **Cost:** Free
- **Feasibility:** 🟢 Easy — **download directly, no registration needed**

#### NY Courts — Criminal Data & Reports
- **URL:** https://ww2.nycourts.gov/criminal-data-reports-35886
- **Alt URL:** https://www.nycourts.gov/division-technology-court-research/criminal-data-and-reports
- **What it has:** CSV extracts of all incoming felonies and misdemeanors by arraignment year; dynamic dashboards for bail reform evaluation; Town & Village data
- **Data format:** CSV (downloadable) + interactive dashboards
- **Cost:** Free
- **Feasibility:** 🟢 Easy

#### NY Courts — Court Data and Statistics Hub
- **URL:** https://ww2.nycourts.gov/court-research/index.shtml
- **What it has:** All available reports, dashboards, data; caseload trends (daily from 2019), criminal data, family court, surrogate's court data
- **Feasibility:** 🟢 Easy

### 3. Recidivism Data

#### NY Division of Criminal Justice Services (DCJS)
- **Statistics URL:** https://www.criminaljustice.ny.gov/crimnet/ojsa/stats.htm
- **What it has:** 
  - Dispositions of adult arrests by race/ethnicity, county, region: https://www.criminaljustice.ny.gov/crimnet/ojsa/dispositions-adult-arrest-demographics.html
  - Felony processing data (arrests → indictments → convictions → sentences)
  - Quarterly Disposition Activity Reports (felony processing from arrest through sentencing): https://www.criminaljustice.ny.gov/crimnet/ojsa/dar/dar-4q-2024-newyorkstate.pdf
- **Data format:** PDF reports + dashboards + some downloadable tables
- **Cost:** Free
- **Feasibility:** 🟡 Medium (some data easy to access; individual-level records require formal request)

#### NYC Criminal Justice Agency (CJA)
- **What it has:** Pretrial outcomes dashboard for NYC; arraignment, release/detention, failure-to-appear rates
- **Vera NY Data Hub references:** https://www.vera.org/ny-data-hub/pretrial
- **Feasibility:** 🟡 Medium

#### NYC Open Data — Daily Inmates in Custody
- **URL:** https://opendata.cityofnewyork.us/ (search "inmates in custody")
- **What it has:** Daily snapshot of NYC jail population; pretrial vs. sentenced; bail set amounts
- **Data format:** CSV/JSON via Socrata API
- **Cost:** Free
- **Feasibility:** 🟢 Easy

### 4. Plea Deal Records — ⭐ NOTABLE

The NY Courts criminal data CSV extracts (from section 2 above) include disposition data.

#### DCJS Felony Processing File
- **What it has:** Tracks felony cases from arrest through disposition; includes guilty plea vs. trial conviction breakdown; original charge vs. conviction charge
- **How to access:** Published as part of DCJS Quarterly Disposition Activity Reports; aggregate tables only for public; individual-level data requires research agreement
- **Feasibility:** 🟡 Medium

### 5. Sentencing Guidelines

**New York does NOT have formal sentencing guidelines.** New York uses:
- **Determinate and indeterminate sentencing** depending on offense class
- For violent felonies: determinate sentences (specific ranges by class)
- For non-violent felonies: indeterminate (minimum-maximum)
- **Drug law reforms (2009 Rockefeller Drug Laws reform)** greatly expanded judicial discretion
- No sentencing commission guidelines grid

- **DCJS** publishes aggregate sentencing statistics by offense type
- **DCJS Quarterly Report** (https://www.criminaljustice.ny.gov/crimnet/ojsa/dar/) includes sentences imposed for convicted felonies
- **Feasibility:** 🟡 Medium (aggregate data available; individual data requires request)

### New York — Existing Research Projects
- **Vera Institute NY Data Hub:** https://www.vera.org/ny-data-hub — comprehensive bail reform data, jail, courts, and community data specific to NY
- **Vera "Bail Reform Benefits New Yorkers" (2026):** Detailed analysis using DCJS pretrial data
- **NYC Mayor's Office of Criminal Justice (MOCJ)** — NYC-specific data
- **Data Collaborative for Justice (Fordham/Rutgers)** — Cook County and Manhattan DA analyses

---

## ILLINOIS

### Court System Overview
Illinois has a **circuit court system** (102 circuits, one per county). Cook County (Chicago) is by far the largest. The Illinois Supreme Court oversees the system; the Administrative Office of the Illinois Courts (AOIC) collects aggregate statistics. Cook County has exceptional open data transparency through the State's Attorney's Office (CCSAO) open data initiative.

### 1. Court Records

#### Administrative Office of Illinois Courts
- **URL:** https://www.illinoiscourts.gov/
- **Circuit Court Reports:** https://www.illinoiscourts.gov/reports/reports-circuit-court-civil-criminal-and-traffic-assessment-reports/
- **What it has:** Annual circuit civil, criminal, and traffic assessment reports; statewide caseload statistics
- **Data format:** PDF/Excel downloadable reports
- **Cost:** Free
- **Feasibility:** 🟢 Easy (aggregate) / 🔴 Hard (individual case records)

#### Cook County Open Data — ⭐⭐ BEST IN CLASS
- **Main Portal:** https://datacatalog.cookcountyil.gov/
- **Cook County State's Attorney (CCSAO) Open Data:** https://www.cookcountystatesattorney.org/data/open-data
- **CCSAO Data Guide:** https://www.cookcountystatesattorney.org/resources/how-read-open-data

**CCSAO publishes 4 full datasets covering the felony case lifecycle:**
  1. **Intake** — cases received by SA's office from law enforcement
  2. **Initiation** — https://datacatalog.cookcountyil.gov/Legal-Judicial/Initiation/7mck-ehwz — cases formally charged
  3. **Disposition** — cases resolved (plea, trial, dismissed, diverted)
  4. **Sentencing** — https://datacatalog.cookcountyil.gov/Courts/Sentencing/tg8v-tm6u/data — sentence details for convicted cases

- **What it has:** Adult criminal felony cases; charge, offense type, defendant demographics, disposition type (plea/trial), sentence type and length; **tens of millions of data points**
- **Data format:** Socrata API (JSON, CSV, XML); free direct download
- **Cost:** Free
- **Feasibility:** 🟢 Easy — **this is one of the most accessible and richest criminal justice datasets in the country**

#### Cook County Circuit Court Data Portal (new, 2025)
- **Announced:** June 2025 (Chicago Appleseed article: https://www.chicagoappleseed.org/2025/06/09/clerk-releases-new-data-portal-a-crucial-step-in-the-right-direction/)
- **What it has:** High-level overview of Cook County Circuit Court caseloads; a new public portal from Circuit Clerk Spyropoulos

#### Cook County — Bulk Data Policy
- **URL:** https://www.cookcountyil.gov/service/circuit-court-public-records-and-data
- **Note:** Bulk court record data requests must be submitted in writing to the Chief Judge for approval — but the CCSAO datasets (above) bypass this for SA-involved cases

### 2. Bail / Pretrial Data

- **Illinois courts do not have a centralized bail data portal** comparable to Texas or NY
- Cook County pretrial data is available through CCSAO datasets (bail set, bond type, pretrial status are fields)
- **Illinois Pretrial Fairness Act (2023)** eliminated cash bail statewide — new data collection is ongoing
- **ICJIA** tracks pretrial outcomes post-PFA implementation
- **Feasibility:** 🟡 Medium (Cook County easy via CCSAO; statewide requires ICJIA or requests)

### 3. Recidivism Data

#### Illinois Department of Corrections (IDOC)
- **Fact Sheets:** https://idoc.illinois.gov/reportsandstatistics/factsheets.html
- **Recidivism Table:** https://idoc.illinois.gov/content/dam/soi/en/web/idoc/reportsandstatistics/documents/fy21-online-recidivism-table.pdf
- **What it has:** Annual recidivism rates by offense type; persons released to parole/MSR/discharge who return within 3 years; FY13–FY18 cohort data published
- **Data format:** PDF fact sheets + tables
- **Cost:** Free
- **Feasibility:** 🟡 Medium (PDF extraction needed)

#### ICJIA Illinois Criminal Justice Cohorts Tool
- **URL:** http://icjia.state.il.us/sac/tools/ICT/IllinoisCohortsTool.cfm
- **What it has:** Interactive tool for aggregate criminal history and recidivism stats for IDOC entries/exits and probation; recidivism rates by release year, offense type
- **Cost:** Free
- **Feasibility:** 🟢 Easy (web tool) / 🟡 Medium (bulk extraction)

#### John Howard Association IDOC Data Analysis
- **URL:** https://www.thejha.org/idoc-data-analysis
- **What it has:** Data visualizations built from IDOC public datasets; admissions, recidivism, demographics
- **Feasibility:** 🟢 Easy

### 4. Plea Deal Records — ⭐⭐ BEST IN CLASS

Cook County's CCSAO datasets are the best publicly available plea deal data in the country.

- **CCSAO Disposition dataset** includes: plea type (guilty plea, bench trial, jury trial, dismissed, diverted), charge at disposition vs. charge at initiation (enabling charge bargaining analysis), sentence type
- **CCSAO Sentencing dataset** includes: sentence type and length for each convicted charge
- **Data Collaborative for Justice felony case tree:** https://dashboard.datacollaborativeforjustice.org/cccptree/ — visual flow of Cook County cases from charge through sentence
- **Feasibility:** 🟢 Easy

#### ICJIA Research Hub Datasets
- **URL:** https://icjia.illinois.gov/researchhub/datasets/
- **What it has:** Various criminal justice datasets including sentencing, courts, corrections
- **Feasibility:** 🟢 Easy

### 5. Sentencing Guidelines

**Illinois HAS sentencing guidelines (voluntary/advisory)**, though much judicial discretion remains.

- Illinois uses **determinate sentencing** with statutory ranges by offense class (Class X, 1, 2, 3, 4)
- A **pre-sentence investigation (PSI) report** is required after guilty plea/verdict — includes detailed offender info to guide sentencing
- **AOIC** publishes aggregate sentencing statistics in circuit court reports
- **CCSAO sentencing data** (above) provides actual sentence data for Cook County
- **Feasibility:** 🟡 Medium (Cook County individual data easy; statewide aggregate only)

### Illinois — Existing Research Projects
- **Chicago Appleseed Center for Fair Courts** (chicagoappleseed.org) — extensive Cook County data analysis
- **ICJIA** (icjia.illinois.gov) — statewide criminal justice research
- **John Howard Association** — prison oversight and data analysis
- **Civic Federation** — spending and population trends

---

## SENTENCING GUIDELINES COMPARISON

| State | Has Guidelines? | Type | Commission? | Notes |
|-------|----------------|------|-------------|-------|
| **California** | No | Determinate triads (low/mid/high) | No | Legislature sets triads; judge picks from 3 options |
| **Texas** | No | Offense grade ranges | No | Statutory ranges by felony/misdemeanor class; wide judicial discretion |
| **Florida** | **Yes** | Scoresheet-based | No formal commission | Criminal Punishment Code; numerical score determines minimum sentence |
| **New York** | No | Determinate (violent) + Indeterminate (non-violent) | No | Complex scheme post-Rockefeller reforms |
| **Illinois** | Partial | Statutory class ranges | No | Determinate ranges by class; advisory guidelines only |
| **Federal** | **Yes** | Guidelines grid | **Yes (USSC)** | Offense level × criminal history → sentencing range; data at ussc.gov |

**Federal comparison data (all 5 states):** https://www.ussc.gov/research/data-reports/geography/2024-federal-sentencing-statistics

---

## SEX OFFENDER REGISTRIES

| State | Registry URL | Bulk Data / API? |
|-------|-------------|-----------------|
| California | https://meganslaw.ca.gov/ | Limited (web only) |
| Texas | https://publicsite.dps.texas.gov/SexOffenderRegistry/ | Web only; scraping possible |
| Florida | https://offenderalert.fdle.state.fl.us/ | FDLE manages; no public API |
| New York | https://www.criminaljustice.ny.gov/nsor/ | Web only (Level 2 & 3 public) |
| Illinois | https://www.isp.state.il.us/sor/sorsearch.cfm | Web only |

**Third-party APIs (paid):**
- Nannostomus (nannostomus.com) — sex offender registry API for all states including NY
- National Sex Offender Public Website (nsopw.gov) has a unified search but no download API

---

## STATE-BY-STATE FEASIBILITY SUMMARY

| Dimension | California | Texas | Florida | New York | Illinois (Cook Co.) |
|-----------|-----------|-------|---------|----------|---------------------|
| Court Records (individual) | 🔴 Hard | 🔴 Hard | 🟡 Medium | 🟡 Medium | 🟢 **Easy** |
| Bail/Pretrial Data | 🔴 Hard | 🟢 **Easy** | 🔴 Hard | 🟢 **Easy** | 🟡 Medium |
| Recidivism Data | 🟡 Medium | 🟡 Medium | 🟡 Medium | 🟡 Medium | 🟡 Medium |
| Plea Deal Records | 🔴 Hard | 🔴 Hard | 🔴 Hard | 🟡 Medium | 🟢 **Easy** |
| Sentencing Data | 🟡 Medium | 🟡 Medium | 🟡 Medium | 🟡 Medium | 🟢 **Easy** |
| **Overall Score** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## RECOMMENDATION: START WITH ILLINOIS (COOK COUNTY)

**Illinois (Cook County) should be tackled first**, for the following reasons:

### Why Cook County / Illinois First:

1. **Unmatched plea deal data** — The Cook County State's Attorney's Office Open Data is the most transparent, granular, and accessible felony prosecution data in the country. Intake → Initiation → Disposition → Sentencing are all available via Socrata API, free, no registration.

2. **Quantifiable charge bargaining** — Because CCSAO data includes both the *charge at initiation* and the *charge at disposition*, you can directly measure charge-down plea bargains at scale. This is rare and extremely valuable.

3. **Full case lifecycle in one dataset** — From arrest/charging through sentence, in a single connected database.

4. **Socrata API = easy programmatic access** — Standard REST API, JSON/CSV, no auth required for public data.

5. **Existing research infrastructure** — Chicago Appleseed, ICJIA, Data Collaborative for Justice, and John Howard Association have already validated and used this data, providing methodological context.

6. **Illinois eliminated cash bail (2023)** — The Pretrial Fairness Act creates a natural policy experiment with before/after data available.

7. **IDOC recidivism data is accessible** — ICJIA cohort tool + IDOC fact sheets give decent recidivism context without formal data sharing agreements.

### Second Priority: New York

NY is second because:
- The NY Courts pretrial CSV downloads (2020–2025) are immediately downloadable, no registration needed, with 28 fields per case
- DCJS criminal statistics are well-organized
- NYC Open Data has jail data with bail amounts via Socrata
- Vera Institute has done significant work creating methodology and validation

### Third Priority: Texas

Texas is strong specifically for **bail data** (PSRS is live and public) but weaker for court disposition/plea data. TDCJ recidivism reports require PDF extraction.

### Avoid California First

California's fragmented 58-county system, no unified case API, and minimal plea deal data make it the hardest starting point. Best approached after building tooling on easier states.

---

## QUICK-START DATA ACQUISITION CHECKLIST

### Immediate Downloads (no auth needed):
- [ ] NY Courts Pretrial CSV 2020–2025: https://ww2.nycourts.gov/pretrial-release-data-33136
- [ ] Cook County CCSAO Sentencing (Socrata): https://datacatalog.cookcountyil.gov/Courts/Sentencing/tg8v-tm6u/data
- [ ] Cook County CCSAO Disposition (Socrata): https://datacatalog.cookcountyil.gov/Legal-Judicial/Initiation/7mck-ehwz
- [ ] Vera Incarceration Trends (GitHub): https://github.com/vera-institute/incarceration-trends
- [ ] The Sentencing Project state data: https://www.sentencingproject.org/research/detailed-state-data-tool/
- [ ] FBI NIBRS API: https://cde.ucr.cjis.gov/ (CDE explorer)
- [ ] CDCR Recidivism Dashboard data export: https://www.cdcr.ca.gov/research/offender-outcomes-characteristics/offender-recidivism/

### Registration Required (free):
- [ ] Measures for Justice portal: https://app.measuresforjustice.org/portal
- [ ] BJS/ICPSR microdata: https://www.icpsr.umich.edu/ (researcher registration)
- [ ] FL FDC OBIS Database (public records request): https://www.fdc.myflorida.com/statistics-and-publications/public-records-requests-for-the-obis-database

### Aggregate PDFs (need extraction tooling):
- [ ] TDCJ FY2024 Statistical Report: https://www.tdcj.texas.gov/documents/Statistical_Report_FY2024.pdf
- [ ] California Courts 2024 Statistics Report: https://courts.ca.gov/sites/default/files/courts/default/2024-12/2024-court-statistics-report.pdf
- [ ] IDOC Recidivism Table: https://idoc.illinois.gov/content/dam/soi/en/web/idoc/reportsandstatistics/documents/fy21-online-recidivism-table.pdf

---

*Last updated: June 2026. Data portals change; verify URLs before use.*
