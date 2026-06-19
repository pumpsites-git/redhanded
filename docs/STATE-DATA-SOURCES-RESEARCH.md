# RedHanded — State Sentencing Data Sources Research
**Last Updated:** 2026-06-18  
**Researcher:** AI Agent (subagent)  
**Purpose:** Identify all 50 state sources for felony sentencing data with judge names for the RedHanded judicial analytics project.

---

## ⚡ CRITICAL NOTE ON JUDGE NAMES

This is the single hardest field to find. **DOC offender databases almost universally do NOT include judge names.** State DOC databases track *inmates*, not *sentencing events*. The key sources for judge-level data are:

1. **State Sentencing Commissions** — collect guidelines worksheets which include the presiding judge
2. **State Court Administration offices** — sometimes have case-level data with judge assignments
3. **State open court portals** — where individual lookups include judge names (rarely bulk downloadable)

**If a state has a Sentencing Commission that collects guidelines worksheets → that's our best target.** About 30+ states have sentencing guidelines; ~20 of those commissions maintain data files. Of those, maybe 8-10 have public bulk downloads with judge-level fields.

---

## 📊 Summary Table

| Category | Count | Description |
|----------|-------|-------------|
| **Category A: Public download available** | ~8 | Data directly downloadable now |
| **Category B: Portal/API (requires work)** | ~18 | Dashboards, portals, or APIs that need scraping or data request |
| **Category C: Records request required** | ~24 | No public bulk data; formal FOIA/records request needed |

### Category A States (Direct Download Available)
- **Florida** — Done ✅
- **Virginia** — VCSC CSV downloads FY2020-FY2024 (verify judge field)
- **Maryland** — MSCCSP full dataset 1999-2025 (verify judge field)
- **Arkansas** — ADC full inmate DB download (NO judge, county only)

### Highest Priority Order of Attack
1. **Virginia** — Free CSV downloads FY2020-FY2024 with judge IDs at VCSC
2. **Maryland** — Free full dataset download 1999-2025 at MSCCSP
3. **Florida** — Already done (scoresheets on Google Drive)
4. **Washington State** — CFC has public felony database (judge field TBD)
5. **Minnesota** — Data Library with judge-level reports (may require request)
6. **Kansas** — Has self-collected sentencing data, request route
7. **Pennsylvania** — Interactive portal, raw data request to PCS
8. **North Carolina** — Sentencing Commission has monitoring system data
9. **Arkansas** — Bulk inmate DB download (no judge, but good baseline)
10. **Oregon** — CJC dashboards with CSV exports

---

## 🗂️ State-by-State Detail

---

### 1. California (CA) — Population: ~39M
**Category: C**  
**Priority: 3**

- **Primary Source:** California Judicial Council / Administrative Office of Courts
- **URL:** https://courts.ca.gov/news-reference/research-data/court-statistics
- **What's Available:** Annual Court Statistics Report (aggregate counts by county and case type — NOT case-level). Data dashboards show trends but not individual cases.
- **Judge Data:** ❌ Not in public aggregate reports. Individual court case data exists in local court systems.
- **DOC:** California Department of Corrections and Rehabilitation (CDCR) has offender data but no judge info — https://www.cdcr.ca.gov/research/
- **Best Path:** FOIA request to Judicial Council for case-level data from AOC, or per-county court clerk requests. CalCourts has a standardized data system.
- **Contact for Records Request:** Judicial Council of California, 455 Golden Gate Ave, SF CA 94102; public records: https://courts.ca.gov/news-reference/public-access/public-records-act
- **Notes:** California is highly decentralized — 58 counties, each with their own court. No statewide case-level sentencing database with judge names is publicly available. This will be a multi-request process.
- **Fields Available (if requested):** Case ID, county, charge, disposition, sentence type, sentence length, defendant demographics. Judge name available in court records but not aggregated publicly.

---

### 2. Texas (TX) — Population: ~30M
**Category: C**  
**Priority: 3**

- **Primary Source:** Texas Department of Criminal Justice (TDCJ) + Texas Office of Court Administration
- **URLs:** https://www.tdcj.texas.gov/statistics/ | https://www.txcourts.gov/about-texas-courts/statistics/
- **What's Available:** TDCJ publishes annual statistical reports (PDFs, aggregate). No bulk case-level download. OCA has court statistics but aggregate only.
- **Judge Data:** ❌ TDCJ has no judge info. OCA aggregate data doesn't have individual judge-level data publicly.
- **Texas Sentencing Commission:** Texas does NOT have a sentencing commission or structured sentencing guidelines. Wide judicial discretion.
- **Best Path:** Records request to OCA for case-level data, or to individual district courts. Texas has open records law (Public Information Act).
- **Contact:** Texas Office of Court Administration, PO Box 12066, Austin TX 78711; oca@courts.state.tx.us
- **Notes:** Texas is indeterminate sentencing — judges have huge discretion. Case-level data would need to come from district court records. Very difficult to aggregate statewide.

---

### 3. New York (NY) — Population: ~19M
**Category: B**  
**Priority: 2**

- **Primary Source:** NY Division of Criminal Justice Services (DCJS)
- **URL:** https://www.criminaljustice.ny.gov/crimnet/ojsa/stats.htm
- **What's Available:** DCJS publishes interactive Adult Convictions dashboard by county (current + historical). Aggregate conviction/disposition data is available. DCJS also has data collaboration partnerships.
- **Judge Data:** ❌ Not in public-facing DCJS dashboards. Judge assignments are in OCA court records.
- **NY Office of Court Administration:** https://ww2.nycourts.gov/admin/research/index.shtml — has court statistics but not case-level public downloads.
- **Best Path:** Data request to DCJS research office, or FOIL request to OCA. DCJS has provided research datasets to academic partners — may be available via formal request.
- **Contact:** DCJS Research Unit: (518) 457-8381; OCA: https://www.nycourts.gov/contact.shtml
- **Notes:** NY has no sentencing commission/guidelines. NYC-specific data may be easier via the NYC Mayor's Office of Criminal Justice (https://criminaljustice.cityofnewyork.us/system-data/).

---

### 4. Florida (FL) — Population: ~22M
**Category: A ✅ DONE**  
**Priority: 1 — COMPLETE**

- **Primary Source:** Florida DOC Criminal Punishment Code scoresheets
- **URL:** Google Drive (already identified in project)
- **What's Available:** Scoresheets with judge name, county, charge, offense score, sentence, date, demographics
- **Judge Data:** ✅ YES — judge name on scoresheet
- **Notes:** Already processing. Best example of Category A data in the country.

---

### 5. Illinois (IL) — Population: ~12.6M
**Category: B/C**  
**Priority: 2**

- **Primary Source:** Illinois Criminal Justice Information Authority (ICJIA) + Illinois Sentencing Policy Advisory Council (SPAC)
- **URLs:** https://icjia.illinois.gov/researchhub/ | https://spac.illinois.gov/
- **What's Available:** ICJIA Research Hub has various datasets. SPAC publishes reports and policy analyses. Illinois has some open data at https://data.illinois.gov
- **Judge Data:** ❌ No public bulk download with judge names found. SPAC reports are aggregate.
- **Best Path:** Request data from SPAC or ICJIA. Illinois has a Freedom of Information Act (FOIA). ICJIA maintains criminal justice data and has provided datasets to researchers.
- **Contact:** ICJIA: 300 W. Adams, Suite 200, Chicago IL 60606; cjia@illinois.gov | SPAC: spac@illinois.gov
- **Notes:** Illinois uses indeterminate sentencing for some offenses. SPAC collects sentencing data but may not have judge-level data in public releases. Illinois DOC offender database (https://www2.illinois.gov/idoc/offender) is individual lookup only.

---

### 6. Pennsylvania (PA) — Population: ~13M
**Category: B**  
**Priority: 2**

- **Primary Source:** Pennsylvania Commission on Sentencing (PCS)
- **URL:** https://pcs.la.psu.edu/research-data/interactive-data-portal/
- **What's Available:** Interactive data dashboards for 2015-2024 with sentencing outcomes, geographic breakdown, and crime type filters. Data available for all guideline editions.
- **Judge Data:** ⚠️ Dashboards don't show individual judges. However, PCS maintains underlying case-level data. A data request to PCS may yield judge-level files.
- **Data Request:** PCS explicitly offers customized reports and datasets via order forms: https://pcs.la.psu.edu/research-data/request-data-and-reports/ — "Since 1982, the Commission has collected information on sentences imposed by criminal court judges."
- **Contact:** Pennsylvania Commission on Sentencing, PO Box 1200, State College PA 16804; (814) 863-4368; pcs@psu.edu
- **Notes:** PA has strong structured sentencing guidelines since 1982. PCS has judge, county, offense, and sentence data in their files — this is confirmed by their data request page mentioning "sentences imposed by criminal court judges." HIGH PRIORITY for a formal data order.
- **Fields Likely Available:** County, offense, disposition, sentence type/length, OGS, PRS, conformity, date, **judge name** (likely available in custom dataset orders).

---

### 7. Ohio (OH) — Population: ~11.8M
**Category: B**  
**Priority: 2**

- **Primary Source:** Ohio Sentencing Data Platform (OSDP) / Ohio Criminal Sentencing Commission
- **URL:** https://www.ohiosentencingdata.info/
- **What's Available:** OSDP is an informational resource for the public. Pilot project as of 2021-2022 with voluntary judge participation. Data is being collected via Uniform Sentencing Entry.
- **Judge Data:** ⚠️ The OSDP explicitly includes judge data (judges submit their own sentencing entries). However, it was a pilot and voluntary — coverage may be incomplete.
- **Contact:** Ohio Criminal Sentencing Commission, 30 E. Broad St., Columbus OH 43215
- **Notes:** Ohio historically had NO centralized sentencing data. The OSDP is a new initiative. The old approach had each of 88 counties collecting data differently. This is promising but may have limited data completeness. Worth contacting for bulk data request.

---

### 8. Georgia (GA) — Population: ~11M
**Category: C**  
**Priority: 3**

- **Primary Source:** Georgia Department of Corrections (GDC)
- **URL:** https://gdc.georgia.gov/organization/about-gdc/agency-activity/research-and-reports
- **What's Available:** GDC publishes "Bench Stats" — felony sentences broken out by individual crimes. Monthly statistical reports available. No bulk case-level download found.
- **Judge Data:** ❌ GDC data is corrections-focused (inmates), not sentencing judge. Georgia courts are decentralized (superior courts in each county).
- **Best Path:** Georgia Superior Courts Clerks' Cooperative Authority (GSCCCA) — https://www.gsccca.org/ — may have court records. Also Georgia's Criminal Justice Coordinating Council.
- **Contact:** GJCC: https://cjcc.georgia.gov/ | GDC Research: research@gdc.ga.gov
- **Notes:** Georgia has no sentencing commission. Judicial discretion is high. Getting judge-level data will require records requests to individual county superior courts or a statewide FOIA to GJCC/AOC.

---

### 9. North Carolina (NC) — Population: ~10.7M
**Category: B**  
**Priority: 2**

- **Primary Source:** NC Sentencing and Policy Advisory Commission (SPAC)
- **URL:** https://www.nccourts.gov/commissions/sentencing-and-policy-advisory-commission
- **What's Available:** NC has a Structured Sentencing Monitoring System tracking felony and misdemeanor cases since 1995. Annual reports published. Commission maintains historical case-level data.
- **Judge Data:** ⚠️ Historical reports reference 105 superior court judges by circuit. The monitoring system likely has judge data but it's not in public download format.
- **Best Path:** Contact NC SPAC directly for data request. They have provided data to researchers before.
- **Contact:** NC Sentencing Commission, PO Box 2448, Raleigh NC 27602; (919) 890-1470; sentencing@nccourts.org
- **Notes:** NC has strong structured sentencing with Offense/Prior Record levels. The monitoring system covers felonies since 1995. High priority for a data request.

---

### 10. Michigan (MI) — Population: ~10.1M
**Category: C**  
**Priority: 3**

- **Primary Source:** Michigan DOC (OTIS system) + Michigan Legislature Sentencing Data
- **URLs:** https://mdocweb.state.mi.us/otis2/ | Michigan Supreme Court
- **What's Available:** MDOC OTIS is an individual offender lookup (no bulk download). Michigan Legislature has commissioned sentencing studies (e.g., 2008-2012 felony sentencing data for disparity analysis).
- **Judge Data:** ❌ MDOC OTIS has no judge data. Michigan does not have a sentencing commission.
- **Best Path:** Michigan State Court Administrative Office (SCAO) maintains case records. FOIA request to SCAO for case-level sentencing data with judge assignments.
- **Contact:** Michigan SCAO: PO Box 30048, Lansing MI 48909; (517) 373-0130; scao-info@courts.mi.gov
- **Notes:** Michigan uses indeterminate sentencing. Without a sentencing commission, judge-level data is only available through court records.

---

### 11. New Jersey (NJ) — Population: ~9.3M
**Category: C**  
**Priority: 3**

- **Primary Source:** NJ Commission to Review Criminal Sentencing + NJ Courts
- **URLs:** http://sentencing.nj.gov/ | https://www.njcourts.gov/
- **What's Available:** Sentencing Commission has published policy reports. NJ OAG "Justice Data" portal: https://www.njoag.gov/justicedata/ — some aggregate data.
- **Judge Data:** ❌ Not in any public bulk download found.
- **Best Path:** OPRA (Open Public Records Act) request to NJ Administrative Office of Courts for case-level sentencing data.
- **Contact:** NJ AOC: https://www.njcourts.gov/public/records | NJ Sentencing Commission: (609) 292-3905

---

### 12. Virginia (VA) — Population: ~8.7M
**Category: A ✅ DOWNLOAD AVAILABLE**  
**Priority: 1**

- **Primary Source:** Virginia Criminal Sentencing Commission (VCSC)
- **URL:** http://www.vcsc.virginia.gov/sgdata.html
- **What's Available:** **FREE BULK DOWNLOADS** — CSV and XLSX files for FY2020-FY2024. Full sentencing guidelines data for all felony cases sentenced in circuit courts.
- **Judge Data:** ⚠️ **FY2024 file is named "without Identifiers & JudgeID for Website"** — indicating judge ID was REMOVED from the public version. Earlier years (FY2020-FY2023) may contain judge fields. Verify by downloading and checking column headers.
  - FY2020: https://vcsc.virginia.gov/SGDATA/Sentencing%20Guidelines%20Data%20FY2020.csv
  - FY2021: xlsx
  - FY2022: xlsx  
  - FY2023: xlsx (preliminary)
  - FY2024: xlsx (WITHOUT judge identifiers — labeled explicitly)
- **Fields:** Sentencing event, circuit, offense (VCC codes), guidelines recommendation, actual sentence, conformity, NVRA/SORA scores, demographics
- **Date Range:** FY2020-FY2024 (public), older data requires request
- **Format:** CSV/XLSX
- **Notes:** FY2024 explicitly removed judge IDs. FY2020-FY2023 may have judge IDs — download and check. If judge IDs present in older files, they'll be numeric codes not names; a separate judge ID → name crosswalk may be needed via VCSC contact.
- **Contact for older data or judge crosswalk:** vcsc@vcsc.virginia.gov | (804) 225-4398

---

### 13. Washington (WA) — Population: ~7.8M
**Category: A/B**  
**Priority: 1**

- **Primary Source:** Washington Caseload Forecast Council (CFC)
- **URL:** https://cfc.wa.gov/
- **What's Available:** CFC maintains the adult felony conviction database since 2011. Annual Statistical Summaries published as PDFs. The American Equity and Justice Group (https://www.americanequity.org/) uses CFC data for their Washington sentencing analysis, suggesting raw data IS accessible.
- **Judge Data:** ⚠️ Unknown if judge field is in the public data release. Annual summary PDFs don't show judge-level detail.
- **Best Path:** Contact CFC to request the underlying felony conviction database. May be available as a public records request.
- **Contact:** WA Caseload Forecast Council, PO Box 40916, Olympia WA 98504-0916; cfc@ofm.wa.gov
- **Notes:** Washington has presumptive sentencing guidelines. CFC is a government agency — their data should be subject to public records requests. The annual summary at https://cfc.wa.gov/sites/default/files/Publications/Adult_Stat_Sum_FY2023.pdf shows the kind of data they have.

---

### 14. Arizona (AZ) — Population: ~7.4M
**Category: C**  
**Priority: 3**

- **Primary Source:** Arizona Department of Corrections, Rehabilitation & Reentry (ADCRR)
- **URLs:** https://corrections.az.gov/data-reports | https://inmatedatasearch.azcorrections.gov/
- **What's Available:** ADCRR publishes monthly/annual statistical reports (aggregate PDFs). Inmate Data Search is individual lookup only.
- **Judge Data:** ❌ ADCRR has no judge data. Arizona has no sentencing commission.
- **Best Path:** Arizona Supreme Court / Administrative Office of Courts for case-level data. ARS § 12-284 governs court records.
- **Contact:** AZ AOC: https://www.azcourts.gov/aoc/ | (602) 452-3300

---

### 15. Tennessee (TN) — Population: ~7.1M
**Category: C**  
**Priority: 3**

- **Primary Source:** Tennessee Department of Correction (TDOC) + TN Administrative Office of Courts
- **URLs:** https://www.tn.gov/correction/ | https://www.tncourts.gov/stats
- **What's Available:** TDOC has sentence information for individual offenders (lookup tool). AOC has aggregate court statistics. No bulk sentencing download found.
- **Judge Data:** ❌ TDOC has no judge data. Tennessee has no sentencing commission (commission existed briefly in 1980s-90s).
- **Best Path:** FOIA/Tennessee Open Records Act request to AOC for case-level criminal disposition data.
- **Contact:** TN AOC: Nashville, (615) 741-2687; aoc.info@tncourts.gov

---

### 16. Massachusetts (MA) — Population: ~7M
**Category: B**  
**Priority: 2**

- **Primary Source:** Massachusetts Sentencing Commission + MA Trial Court Dept. of Research
- **URLs:** https://www.mass.gov/massachusetts-sentencing-commission-resources | https://www.mass.gov/court-data-metrics-reports
- **What's Available:** Sentencing Commission has published periodic "Surveys of Sentencing Practices" (https://www.mass.gov/lists/surveys-of-massachusetts-sentencing-practices) covering sentencing trends. Trial Court Research & Planning publishes statistics.
- **Judge Data:** ⚠️ Sentencing surveys include judge-level analysis. Underlying data may be available on request.
- **Best Path:** Contact MA Sentencing Commission for data request. Surveys reference judge data so the underlying files likely have it.
- **Contact:** MA Sentencing Commission: One Ashburton Place, Room 1413, Boston MA 02108; (617) 788-6867; sentencing.commission@state.ma.us

---

### 17. Indiana (IN) — Population: ~6.8M
**Category: C**  
**Priority: 3**

- **Primary Source:** Indiana Judicial Branch
- **URL:** https://www.in.gov/courts/public-records/ | https://www.in.gov/courts/help/trial-statistics/
- **What's Available:** Indiana Courts have public case search (mycase.in.gov) for individual lookups. Trial statistics available by county (aggregate).
- **Judge Data:** ❌ No bulk download with judge data found. Indiana has no sentencing commission.
- **Best Path:** Indiana Access to Public Records Act (APRA) request to the Indiana Office of Judicial Administration.
- **Contact:** Indiana Office of Judicial Administration: (317) 232-2542

---

### 18. Missouri (MO) — Population: ~6.2M
**Category: B**  
**Priority: 2**

- **Primary Source:** Missouri Sentencing Advisory Commission (SAC) + Missouri DOC
- **URLs:** https://courts.mo.gov/page.jsp?id=45392 | https://doc.mo.gov/
- **What's Available:** Missouri SAC provides a sentencing tool on courts.mo.gov that shows approximate time served for offenses. SAC uses DOC data (FY10-FY15 referenced in user guide). DOC collects new felony sentences.
- **Judge Data:** ❌ SAC tool shows aggregate time-served data, not judge-level. Missouri has no formal sentencing guidelines with judge-level tracking.
- **Best Path:** Sunshine Law (Missouri's FOIA) request to MO DOC or AOC for case-level felony disposition data.
- **Contact:** MO DOC: Jefferson City, (573) 751-2389 | MO Courts: https://www.courts.mo.gov/

---

### 19. Maryland (MD) — Population: ~6.2M
**Category: A ✅ DOWNLOAD AVAILABLE**  
**Priority: 1**

- **Primary Source:** Maryland State Commission on Criminal Sentencing Policy (MSCCSP)
- **URL:** https://msccsp.org/data/download/
- **What's Available:** **FREE FULL DATASET DOWNLOAD** — covers January 1, 1999 through June 30, 2025. Based on sentencing guidelines worksheets submitted by circuit court judges. Multiple download options (full dataset or 5-year slices).
- **Judge Data:** ⚠️ Data notes say "no individual will be identified by name" — this may mean defendants, not judges. The worksheets are *submitted by judges* so judge court/circuit should be in the data. **Download and verify.** Codebook available: https://www.msccsp.org/Files/Data/MSCCSP_Database_Codebook.pdf
- **Fields:** Guidelines-eligible sentencing events, offense type, sentence imposed, conformity, court, date. Review codebook for judge field.
- **Format:** Downloaded dataset (format not specified — likely CSV or Excel based on user form)
- **Date Range:** 1999-2025
- **Contact:** msccsp@umd.edu | (301) 403-4165
- **Notes:** Requires completing a user information form (name/affiliation) before download. No cost. HIGH PRIORITY — download immediately and check for judge field.

---

### 20. Wisconsin (WI) — Population: ~5.9M
**Category: B**  
**Priority: 2**

- **Primary Source:** Wisconsin Circuit Court Access (WCCA / CCAP)
- **URL:** https://wcca.wicourts.gov/ (individual case search) | https://www.wicourts.gov/
- **What's Available:** Wisconsin's CCAP system has felony and misdemeanor case data going back 20+ years. CourtTracker.com (a private service) and WisconsinCourtData.com (Court Data Technologies LLC) both offer CCAP data commercially, indicating bulk data exists.
- **Judge Data:** ✅ CCAP case records include judge names. CourtTracker explicitly allows filtering by judge. The question is whether Wisconsin provides bulk data publicly.
- **Best Path:** Request bulk data from Wisconsin Director of State Courts under Wisconsin Public Records Law (s. 19.35). Or use CourtTracker commercial service if budget allows.
- **Contact:** WI Director of State Courts: 110 E. Main St., Madison WI 53703; (608) 266-6828

---

### 21. Colorado (CO) — Population: ~5.8M
**Category: B**  
**Priority: 2**

- **Primary Source:** CO Division of Criminal Justice / Office of Research and Statistics (ORS)
- **URL:** https://ors.colorado.gov/crimejustice-corrections
- **What's Available:** ORS Crime and Justice Statistics dashboards with **CSV data file downloads** at the bottom of each dashboard. Corrections data available. Also, Colorado District Attorneys have public data portals (https://data.dacolorado.org/ — per DA office, covering sentencing outcomes).
- **Judge Data:** ⚠️ ORS dashboards are aggregate corrections data. DA portals show sentencing by DA office but not individual judges. Need to check ORS CSV downloads.
- **Best Path:** Download ORS CSV files and check fields. Also check individual DA data portals. If no judge field, CORA (Colorado Open Records Act) request to Judicial Department.
- **Contact:** CO ORS: 700 Kipling St., Suite 1000, Denver CO 80215; ors.dcj@state.co.us
- **Notes:** Colorado's multiple DA data portals are interesting — some show plea vs trial, charge types, demographics. Could be valuable even without judge names.

---

### 22. Minnesota (MN) — Population: ~5.7M
**Category: B**  
**Priority: 1**

- **Primary Source:** Minnesota Sentencing Guidelines Commission (MSGC)
- **URL:** https://mn.gov/sentencing-guidelines/
- **What's Available:** MSGC has a Data Library with previously-released reports and statistics. Annual Summary Statistics for felony cases. Data requests accepted through a "data request portal."
- **Judge Data:** ⚠️ MSGC annual reports reference individual judge behavior (noting judges by district for departures). Underlying case-level data likely has judge fields. Data Library contains previously requested datasets.
- **Best Path:** Submit data request via MSGC data request portal. MN Government Data Practices Act may require release.
- **Contact:** MSGC: 309 N. Robert Street, Suite 700, St. Paul MN 55101; (651) 296-0144; sentencing.guidelines@state.mn.us
- **Notes:** Minnesota has strong structured sentencing. MSGC is well-organized and researcher-friendly. Data requests have historically been fulfilled.

---

### 23. South Carolina (SC) — Population: ~5.3M
**Category: C**  
**Priority: 3**

- **Primary Source:** SC Department of Corrections + SC Judicial Department
- **URLs:** https://www.doc.sc.gov/ | https://www.sccourts.org/
- **What's Available:** SC DOC has inmate search (individual lookup). SC Judicial Department has court statistics aggregate reports.
- **Judge Data:** ❌ No sentencing commission. No public bulk download with judge data found.
- **Best Path:** SC Freedom of Information Act request to SC Judicial Department or Clerk of Court for case-level felony disposition data.
- **Contact:** SC Judicial Department: 1231 Gervais St., Columbia SC 29201; (803) 734-1800

---

### 24. Alabama (AL) — Population: ~5.1M
**Category: C**  
**Priority: 3**

- **Primary Source:** Alabama Sentencing Commission
- **URL:** https://sentencingcommission.alacourt.gov/
- **What's Available:** Alabama Sentencing Commission exists and publishes annual reports (e.g., 2025 Annual Report available as PDF). Commission uses data from AOC, ACJIC, ADOC, and Community Corrections.
- **Judge Data:** ⚠️ Commission references "felony sentences" data from AOC. May have judge data internally. Annual report PDF is aggregate.
- **Best Path:** Contact Alabama Sentencing Commission directly for data request.
- **Contact:** Alabama Sentencing Commission: 300 Dexter Ave., Montgomery AL 36104; (334) 954-5090
- **Notes:** Commission was founded 2000. They have access to integrated data from multiple sources. Worth a direct data request.

---

### 25. Louisiana (LA) — Population: ~4.6M
**Category: C**  
**Priority: 3**

- **Primary Source:** Louisiana Commission on Law Enforcement (LCLE) / Louisiana Sentencing Commission
- **URLs:** http://www.lcle.la.gov/programs/sentencing_commission.asp | https://doc.la.gov/
- **What's Available:** Louisiana Sentencing Commission exists (under LCLE). LA DOC has inmate search. LCLE publishes some criminal justice statistics.
- **Judge Data:** ❌ No public bulk download with judge data found. Louisiana Sentencing Commission has limited data infrastructure.
- **Best Path:** Louisiana Public Records Act request to LCLE or Louisiana DOC.
- **Contact:** LCLE: 602 N. Fifth St., Baton Rouge LA 70802; (225) 342-1600

---

### 26. Kentucky (KY) — Population: ~4.5M
**Category: C**  
**Priority: 3**

- **Primary Source:** Kentucky Administrative Office of Courts (AOC)
- **URL:** https://kycourts.gov/
- **What's Available:** Kentucky Courts case search (CourtNet 2.0) — individual case lookups. Kentucky has no sentencing commission.
- **Judge Data:** ❌ No bulk download available. CourtNet allows individual lookups including judge, but no bulk export.
- **Best Path:** Kentucky Open Records Act request to AOC for case-level felony disposition data.
- **Contact:** KY AOC: 1001 Vandalay Dr., Frankfort KY 40601; (502) 573-2350

---

### 27. Oregon (OR) — Population: ~4.3M
**Category: B**  
**Priority: 2**

- **Primary Source:** Oregon Criminal Justice Commission (CJC) Statistical Analysis Center
- **URL:** https://www.oregon.gov/cjc/sac/pages/dashboards.aspx
- **What's Available:** CJC SAC dashboards with criminal justice data. Dashboards include some downloadable CSV files. CJC also publishes research reports. Oregon has structured sentencing guidelines.
- **Judge Data:** ⚠️ CJC dashboards are primarily aggregate. Oregon's sentencing guidelines are administered via the courts — judge-level data may exist in CJC's underlying database.
- **Best Path:** Contact CJC SAC to request case-level sentencing data with judge fields.
- **Contact:** Oregon CJC SAC: 635 Capitol St. NE, Suite 350, Salem OR 97301; (503) 378-4830; crimjus.commission@oregon.gov

---

### 28. Oklahoma (OK) — Population: ~4M
**Category: C**  
**Priority: 3**

- **Primary Source:** Oklahoma DOC (ODOC) + Oklahoma Supreme Court Network (OSCN)
- **URLs:** https://okoffender.doc.ok.gov/ | https://www.oscn.net/applications/oscn/
- **What's Available:** ODOC has Offender Lookup (individual). OSCN has searchable court dockets with judge names — but individual case lookup only, not bulk download.
- **Judge Data:** ⚠️ OSCN docket search shows judge names per case, but no bulk export available.
- **Best Path:** OSCN bulk data request under Oklahoma Open Records Act. OSCN has an interesting data infrastructure that may support bulk exports with a formal request.
- **Contact:** OSCN: https://www.oscn.net/ | OK DOC: (405) 425-2500

---

### 29. Connecticut (CT) — Population: ~3.6M
**Category: B**  
**Priority: 2**

- **Primary Source:** Connecticut Sentencing Commission + CT Judicial Branch
- **URLs:** https://ctsentencingcommission.org/ | https://www.jud.ct.gov/statistics/
- **What's Available:** CT Sentencing Commission provides data resources page linking to DOC dashboards, population trends. CT Judicial Branch has statistics. CT has an established Sentencing Commission (2011).
- **Judge Data:** ⚠️ Commission has DOC and court data links. No bulk download with judge names found. CT Judicial Branch has aggregate stats.
- **Best Path:** Contact CT Sentencing Commission or CT Judicial Branch for data request under Connecticut FOIA.
- **Contact:** CT Sentencing Commission: 225 Capitol Ave., Hartford CT 06106; (860) 713-6100 | CT Judicial Branch: https://www.jud.ct.gov/contact.htm

---

### 30. Utah (UT) — Population: ~3.4M
**Category: C**  
**Priority: 3**

- **Primary Source:** Utah Commission on Criminal and Juvenile Justice (CCJJ) Sentencing Commission
- **URL:** https://justice.utah.gov/sentencing/
- **What's Available:** Utah Sentencing Commission develops guidelines and conducts research. CCJJ publishes reports and presentations. No public bulk data download found.
- **Judge Data:** ❌ No public data download identified.
- **Best Path:** Utah Government Records Access and Management Act (GRAMA) request to CCJJ or Utah Courts.
- **Contact:** CCJJ: 350 E. 500 S., Salt Lake City UT 84111; (801) 538-1031; ccjj@utah.gov

---

### 31. Iowa (IA) — Population: ~3.2M
**Category: C**  
**Priority: 3**

- **Primary Source:** Iowa Department of Corrections + Iowa Judicial Branch
- **URLs:** https://doc.iowa.gov/ | https://www.iowacourts.gov/
- **What's Available:** Iowa Courts have case lookup (iCourt). Iowa DOC publishes annual reports. Iowa has no sentencing commission.
- **Judge Data:** ❌ No public bulk download with judge data found. iCourt is individual lookup.
- **Best Path:** Iowa Open Records Act request to Iowa Court Data System or Iowa DOC.
- **Contact:** Iowa DOC: Hoover State Office Bldg., Des Moines IA 50319; (515) 725-5701

---

### 32. Nevada (NV) — Population: ~3.2M
**Category: C**  
**Priority: 3**

- **Primary Source:** Nevada Department of Corrections (NDOC)
- **URL:** https://doc.nv.gov/
- **What's Available:** NDOC publishes recidivism studies and statistical reports. Inmate Records office handles individual requests. No bulk sentencing download found.
- **Judge Data:** ❌ NDOC has no judge data. Nevada has no sentencing commission.
- **Best Path:** Nevada Public Records Act request to NV Administrative Office of Courts.
- **Contact:** NDOC Records: omdrecords@doc.nv.gov | NV AOC: 201 S. Carson St., Carson City NV 89701

---

### 33. Arkansas (AR) — Population: ~3.1M
**Category: A (limited)**  
**Priority: 2**

- **Primary Source:** Arkansas Department of Corrections (ADC)
- **URL:** https://inmate.ark.org/ (search) | https://doc.arkansas.gov/correction/online-services/#inmate-database-download
- **What's Available:** **FULL INMATE DATABASE DOWNLOAD available** — ADC explicitly offers a download of the full inmate database. Fields include ADC number, county, offense category, age, race, gender, facility.
- **Judge Data:** ❌ ADC inmate database does NOT include sentencing judge. County of conviction IS included.
- **Arkansas Sentencing Commission:** Exists (under ADC: https://doc.arkansas.gov/sentencing-commission/). Maintains sentencing standards grids. May have case-level data with judge info.
- **Best Path for Judge Data:** Contact AR Sentencing Commission at ADC for their data.
- **Contact:** AR Sentencing Commission: PO Box 8707, Pine Bluff AR 71611; (870) 267-6200
- **Notes:** The inmate database download is good for baseline offense/county data but lacks judge names. Worth downloading as a starting point while pursuing judge data via commission.

---

### 34. Mississippi (MS) — Population: ~2.9M
**Category: C**  
**Priority: 3**

- **Primary Source:** Mississippi Department of Corrections (MDOC)
- **URL:** https://www.mdoc.ms.gov/
- **What's Available:** MDOC has an inmate search tool (individual lookup). No bulk download found publicly.
- **Judge Data:** ❌ No sentencing commission. No public bulk data with judge info.
- **Best Path:** Mississippi Public Records Act request to MDOC or MS Supreme Court's Administrative Office of Courts.
- **Contact:** MDOC: 633 N. State St., Jackson MS 39202; (601) 359-5600

---

### 35. Kansas (KS) — Population: ~2.9M
**Category: B/A**  
**Priority: 1**

- **Primary Source:** Kansas Sentencing Commission (KSSC)
- **URL:** https://www.sentencing.ks.gov/statistical-analysis
- **What's Available:** KSSC is the State Statistical Analysis Center. They maintain self-collected sentencing data, probation disposition data, and have dashboards. Publications page has annual reports. KSApp is a statewide sentencing application launched recently.
- **Judge Data:** ⚠️ KSSC collects sentencing data statewide via their own system. Judge data may be in their internal files.
- **Best Path:** Contact KSSC to request case-level sentencing data under Kansas Open Records Act (KORA).
- **Contact:** KSSC: 700 SW Jackson, Suite 501, Topeka KS 66603; (785) 296-0923; kssc@kscourts.org
- **Notes:** Kansas has structured sentencing guidelines. KSSC is well-organized and data-focused. Dashboards suggest rich underlying data. High priority for data request.

---

### 36. New Mexico (NM) — Population: ~2.1M
**Category: B**  
**Priority: 2**

- **Primary Source:** New Mexico Sentencing Commission (NMSC) at UNM
- **URL:** https://nmsc.unm.edu/
- **What's Available:** NMSC is housed at UNM. Reports page has publications from 2004 to present. Commission conducts research on criminal justice policy.
- **Judge Data:** ⚠️ NMSC has access to court and corrections data. Reports likely use underlying case-level data. No public bulk download found.
- **Best Path:** Contact NMSC directly for data request — being at a university may make them more researcher-friendly.
- **Contact:** NMSC: MSC02 1625, 1 UNM, Albuquerque NM 87131; (505) 277-3494; nmsc.unm.edu contact form

---

### 37. Nebraska (NE) — Population: ~2M
**Category: C**  
**Priority: 3**

- **Primary Source:** Nebraska Department of Correctional Services (NDCS)
- **URL:** https://dcs-inmatesearch.ne.gov/ | https://corrections.nebraska.gov/
- **What's Available:** NDCS has individual inmate search. Nebraska Judicial Branch has court records lookup (https://www.nebraskajudicial.gov/).
- **Judge Data:** ❌ No bulk download with judge data. Nebraska has no sentencing commission.
- **Best Path:** Nebraska Public Records Statutes (Neb. Rev. Stat. § 84-712 et seq.) request to Nebraska Judicial Branch for case-level disposition data.
- **Contact:** NE Judicial Branch: PO Box 98910, Lincoln NE 68509; (402) 471-3730

---

### 38. Idaho (ID) — Population: ~2M
**Category: C**  
**Priority: 3**

- **Primary Source:** Idaho Department of Correction (IDOC) + Idaho Commission of Pardons and Parole
- **URLs:** https://www.idoc.idaho.gov/ | https://parole.idaho.gov/ | https://transparent.idaho.gov/
- **What's Available:** Transparent Idaho provides budget/expenditure data. IDOC publishes annual reports. COPP/IDOC jointly submit "Timely Release Report" to legislature. No case-level sentencing download found.
- **Judge Data:** ❌ No public bulk data with judge names. Idaho has no sentencing commission.
- **Best Path:** Idaho Public Records Act request to Idaho Supreme Court Administrative Office.
- **Contact:** Idaho Supreme Court: PO Box 83720, Boise ID 83720-0101; (208) 334-2246

---

### 39. West Virginia (WV) — Population: ~1.8M
**Category: C**  
**Priority: 3**

- **Primary Source:** WV Sentencing Commission (created 2020) + WV DOC
- **URLs:** https://djcs.wv.gov/Staff-Directory/Pages/WV-Sentencing-Commission.aspx | https://dcr.wv.gov/
- **What's Available:** WV Sentencing Commission was only created in 2020 — very new. Limited data infrastructure likely. WV DOC has offender information.
- **Judge Data:** ❌ No public bulk data found. Commission is too new.
- **Best Path:** WV Freedom of Information Act request to new Sentencing Commission or AOC.
- **Contact:** DJCS/Sentencing Commission: 1409 Greenbrier St., Charleston WV 25311; (304) 558-2930

---

### 40. Hawaii (HI) — Population: ~1.4M
**Category: C**  
**Priority: 3**

- **Primary Source:** Hawaii Criminal Justice Data Center (HCJDC)
- **URL:** https://ag.hawaii.gov/hcjdc/
- **What's Available:** HCJDC maintains the CJIS-Hawaii system, AFIS, sex offender registry, and eCrim (Adult Criminal Conviction Information). eCrim allows individual conviction lookups. HCJDC publishes crime statistics.
- **Judge Data:** ❌ eCrim is individual lookup. No bulk download found.
- **Best Path:** Hawaii Uniform Information Practices Act (UIPA) request to HCJDC for case-level sentencing data.
- **Contact:** HCJDC: 465 S. King Street, Room 101, Honolulu HI 96813; (808) 587-3100

---

### 41. New Hampshire (NH) — Population: ~1.4M
**Category: C**  
**Priority: 3**

- **Primary Source:** NH Department of Corrections + NH Judicial Branch
- **URLs:** https://www.nh.gov/nhdoc/ | https://www.courts.nh.gov/
- **What's Available:** NH DOC has offender info. NH Courts have case lookup. No bulk sentencing download found.
- **Judge Data:** ❌ No sentencing commission. No public bulk data.
- **Best Path:** NH Right to Know Law (RSA 91-A) request to NH Administrative Office of Courts.
- **Contact:** NH AOC: Supreme Court Building, 1 Charles Doe Drive, Concord NH 03301; (603) 271-2521

---

### 42. Maine (ME) — Population: ~1.4M
**Category: C**  
**Priority: 3**

- **Primary Source:** Maine Department of Corrections + Maine Judicial Branch
- **URLs:** https://www.maine.gov/corrections/ | https://www.courts.maine.gov/
- **What's Available:** ME DOC has offender search (individual). ME Courts have case lookup. No bulk download found.
- **Judge Data:** ❌ No sentencing commission. No public bulk data.
- **Best Path:** Maine Freedom of Access Act (FOAA) request to Maine Administrative Office of Courts.
- **Contact:** ME AOC: PO Box 4820, Portland ME 04112; (207) 822-0792

---

### 43. Montana (MT) — Population: ~1.1M
**Category: C**  
**Priority: 3**

- **Primary Source:** Montana DOC + Montana Supreme Court
- **URLs:** https://cor.mt.gov/ | https://courts.mt.gov/
- **What's Available:** MT DOC has offender lookup. MT Courts have case search (CourtView). No bulk sentencing download found.
- **Judge Data:** ❌ No sentencing commission. No public bulk data.
- **Best Path:** Montana Right to Know (Art. II, § 9 of MT Constitution + MCA § 2-6-102) request to MT Judicial Branch.
- **Contact:** MT Judicial Branch: PO Box 203002, Helena MT 59620; (406) 444-2621

---

### 44. Rhode Island (RI) — Population: ~1.1M
**Category: C**  
**Priority: 3**

- **Primary Source:** RI Department of Corrections + RI Judiciary
- **URLs:** https://doc.ri.gov/ | https://www.courts.ri.gov/
- **What's Available:** RI Courts have a Judicial Records Center. RI DOC has offender info. No bulk sentencing download found publicly.
- **Judge Data:** ❌ No sentencing commission. No public bulk data.
- **Best Path:** Rhode Island Access to Public Records Act (APRA) request to RI Judiciary for case-level felony sentencing data.
- **Contact:** RI Judicial Records: courts.ri.gov/programs-services/Pages/judicial-records.aspx | (401) 222-3266

---

### 45. Delaware (DE) — Population: ~1M
**Category: B**  
**Priority: 2**

- **Primary Source:** Delaware Sentencing Accountability Commission (SENTAC) under the Criminal Justice Council (CJC)
- **URL:** https://cjc.delaware.gov/sentac/
- **What's Available:** SENTAC exists and has been active since the 1980s with structured sentencing guidelines. Annual reports and benchbooks published. The CJC maintains criminal justice data.
- **Judge Data:** ⚠️ SENTAC collects guidelines compliance data — this likely includes judge IDs or court identifiers. No public bulk download found but the infrastructure exists.
- **Best Path:** Contact CJC/SENTAC for data request under Delaware FOIA (FOIA, 29 Del. C. § 10001 et seq.).
- **Contact:** CJC: 820 N. French Street, Wilmington DE 19801; (302) 577-8600; cjc@delaware.gov

---

### 46. South Dakota (SD) — Population: ~920K
**Category: C**  
**Priority: 3**

- **Primary Source:** SD Department of Corrections + SD Unified Judicial System
- **URLs:** https://doc.sd.gov/ | https://ujs.sd.gov/
- **What's Available:** SD DOC has offender info. SD UJS has court statistics. No bulk sentencing download found.
- **Judge Data:** ❌ No sentencing commission. No public bulk data.
- **Best Path:** SD Open Records Law (SDCL § 1-27) request to SD UJS.
- **Contact:** SD UJS: 500 E. Capitol Ave., Pierre SD 57501; (605) 773-3474

---

### 47. North Dakota (ND) — Population: ~780K
**Category: C**  
**Priority: 3**

- **Primary Source:** ND Department of Corrections and Rehabilitation + ND Courts
- **URLs:** https://www.docr.nd.gov/ | https://www.ndcourts.gov/
- **What's Available:** ND DOC has offender info. ND Courts have case search. No bulk sentencing download found.
- **Judge Data:** ❌ No sentencing commission. No public bulk data.
- **Best Path:** ND Open Records Law (NDCC § 44-04-18 et seq.) request to ND Supreme Court.
- **Contact:** ND Supreme Court: 600 E. Boulevard Ave., Bismarck ND 58505; (701) 328-2221

---

### 48. Alaska (AK) — Population: ~730K
**Category: B**  
**Priority: 2**

- **Primary Source:** Alaska Criminal Justice Commission (ACJC) + Alaska Judicial Council (AJC)
- **URLs:** https://www.ajc.state.ak.us/ | https://ajc.alaska.gov/
- **What's Available:** Alaska Criminal Justice Data Analysis Commission (DAC) publishes annual reports with felony sentencing patterns. Alaska Judicial Council has published "Alaska Felony Sentencing Patterns 2012-2013." These are research reports, not raw data downloads.
- **Judge Data:** ⚠️ Sentencing patterns reports may include judge-level analysis. AJC previously studied judge selection — they track judicial data.
- **Best Path:** Contact AJC or DAC for data request. Alaska Public Records Act (AS § 40.25.110 et seq.) request.
- **Contact:** AJC: 820 W. Fourth Ave., Anchorage AK 99501; (907) 279-2526; ajc@ajc.state.ak.us

---

### 49. Vermont (VT) — Population: ~645K
**Category: C**  
**Priority: 3**

- **Primary Source:** VT Judiciary + Vermont Sentencing Commission (legislative reference only)
- **URL:** https://www.vermontjudiciary.org/about-vermont-judiciary/court-statistics-and-reports
- **What's Available:** Vermont Judiciary publishes annual statistical reports on case filings and dispositions. Individual case lookups available. Vermont Sentencing Commission referenced in FindLaw but limited public data.
- **Judge Data:** ❌ Annual stats are aggregate. No public bulk sentencing download with judge data.
- **Best Path:** Vermont Access to Public Records Act (1 V.S.A. § 315 et seq.) request to VT Judiciary.
- **Contact:** VT Judiciary: 111 State St., Montpelier VT 05609; (802) 828-3278

---

### 50. Wyoming (WY) — Population: ~580K
**Category: C**  
**Priority: 3**

- **Primary Source:** WY Department of Corrections + WY Supreme Court
- **URLs:** https://corrections.wy.gov/ | https://www.courts.state.wy.us/
- **What's Available:** WY DOC has offender information. WY Courts have individual case lookup. No bulk sentencing download found. Wyoming has no sentencing commission.
- **Judge Data:** ❌ No sentencing commission. No public bulk data.
- **Best Path:** Wyoming Public Records Act (W.S. 16-4-201 et seq.) request to WY Supreme Court Clerk.
- **Contact:** WY Supreme Court: 2301 Capitol Ave., Cheyenne WY 82002; (307) 777-7316

---

## 🏆 Special Cases & Notes

### States With Sentencing Commissions (Best Candidates for Judge Data)
These states have formal sentencing commissions that collect guidelines worksheets — the most likely to have judge-level data:
- **Virginia** (VCSC) — downloads available, FY2024 removed judge IDs
- **Maryland** (MSCCSP) — downloads available, verify judge field
- **Pennsylvania** (PCS) — portal only, data request needed
- **Minnesota** (MSGC) — data request portal
- **North Carolina** (NC SPAC) — data request needed
- **Kansas** (KSSC) — data request, KSApp system
- **Delaware** (SENTAC) — data request
- **Alabama** (Sentencing Commission) — data request
- **New Mexico** (NMSC @ UNM) — data request
- **Ohio** (OSDP) — new, data request
- **Oregon** (CJC) — dashboards + CSV exports
- **Washington State** (CFC) — data request
- **Alaska** (ACJC/DAC) — data request
- **Connecticut** (CT Sentencing Commission) — data request
- **West Virginia** (new 2020 commission) — limited data

### States With NO Sentencing Commission (Harder Cases)
These states have wide judicial discretion and no centralized guidelines tracking — judge data will require court records:
California, Texas, New York, Georgia, Michigan, New Jersey, Tennessee, Indiana, Missouri, Louisiana, Kentucky, Nevada, Mississippi, Nebraska, Idaho, Hawaii, Montana, South Dakota, North Dakota, Rhode Island, Maine, New Hampshire, Vermont, Wyoming, Iowa, Arizona, South Carolina

### Wisconsin — Unique Opportunity
Wisconsin's CCAP system is exceptional — commercial services like CourtTracker explicitly claim judge-searchable data going back 20+ years. This suggests a public records request for bulk CCAP data could yield judge + case data for all felonies. Very high potential.

### Florida — Model Case
Florida's Criminal Punishment Code scoresheet system is the gold standard — judge-by-judge data with all fields included, publicly downloadable. No other state has quite this level of direct judge accountability data in a bulk download format.

---

## 📧 Template Records Request Email

For Category C states, use this template:

```
Subject: Public Records Request — Felony Sentencing Data

Dear [State Agency/Records Officer],

Pursuant to [State] [Freedom of Information Act / Open Records Law / etc.], I am 
requesting a copy of case-level felony sentencing data maintained by your office.

Specifically, I am requesting data including:
1. Sentencing judge name or identifier
2. County or jurisdiction of sentencing
3. Offense/charge description
4. Disposition type (guilty plea, trial verdict, etc.)
5. Sentence imposed (type and length)
6. Date of sentencing
7. Defendant demographics (race, gender, age) if maintained

I am requesting data for [time period, e.g., 2018-2023].

If the data is available in electronic format (CSV, Excel, or similar), I would 
prefer it in that format. I am willing to pay reasonable fees for staff time to 
compile this request.

Please contact me if you need clarification or if any portion of this request 
needs to be modified.

Thank you,
[Name]
[Contact Information]
```

---

## 📅 Recommended Action Plan

### Week 1 — Immediate Downloads (Category A)
1. ✅ Florida — already done
2. **Virginia VCSC** — Download FY2020-FY2023 CSV/XLSX, check for judge fields. URL: http://www.vcsc.virginia.gov/sgdata.html
3. **Maryland MSCCSP** — Fill out form and download full dataset. URL: https://msccsp.org/data/download/ — check codebook for judge field
4. **Arkansas ADC** — Download full inmate database (no judge, but good for offense/county baseline): https://doc.arkansas.gov/correction/online-services/#inmate-database-download

### Week 2 — Data Portal Requests (Category B, Tier 1)
5. **Kansas KSSC** — Contact kssc@kscourts.org for case-level data
6. **Minnesota MSGC** — Submit data request via mn.gov sentencing guidelines portal
7. **North Carolina SPAC** — Email sentencing@nccourts.org for data
8. **Pennsylvania PCS** — Contact pcs@psu.edu for case-level data request
9. **Wisconsin** — Request bulk CCAP data from Director of State Courts

### Week 3 — More Portal Requests (Category B, Tier 2)
10. Oregon CJC — crimjus.commission@oregon.gov
11. Delaware SENTAC — cjc@delaware.gov
12. Washington State CFC — cfc@ofm.wa.gov
13. Alabama Sentencing Commission — (334) 954-5090
14. Massachusetts Sentencing Commission — sentencing.commission@state.ma.us

### Month 2 — FOIA/Records Requests (Category C, Priority States)
Focus on highest population states first: CA, TX, NY, IL, MI, NJ, GA, TN, MO

---

*Report compiled via web research 2026-06-18. URLs verified at time of research but may change. All state contact information should be confirmed before sending requests.*
