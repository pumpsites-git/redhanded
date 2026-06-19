# Sentencing Data Download Report
Generated: 2026-06-18

## Virginia VCSC

### Files Downloaded
| File | Size | Rows | Columns |
|------|------|------|---------|
| SG_FY2020.csv | 23 MB | 22,062 | 219 |
| SG_FY2021.xlsx | 19 MB | 20,714 | 234 |
| SG_FY2022.xlsx | 33 MB | 21,289 | 399 |
| SG_FY2023.xlsx | 29 MB | 19,075 | 399 |
| SG_FY2024_no_JudgeID.xlsx | 32 MB | 19,731 | 418 |

**Total: ~135 MB, ~102,871 sentencing events**

### Date Ranges
- FY2020: Sentences dated July 2019 – June 2020
- FY2021: July 2020 – June 2021
- FY2022: July 2021 – June 2022
- FY2023: July 2022 – June 2023
- FY2024: July 2023 – June 2024

### Judge ID/Name Fields
**NONE FOUND IN ANY FILE**

The judge-related columns present are:
- `Judicial Circuit` — circuit NUMBER only (e.g., 1, 2, 3...), not judge identity
- `Effective Sentence (Judge-w/o Alternative Sentencing)` — calculated field, not an ID
- `CDW - Other - Source - Judge` — binary flag if judge was CDW source
- `Jury Trial: Jury Recommended Sentence v Sentence Set by Judge` — trial type flag

**Critical finding**: FY2024 filename explicitly says "without Identifiers & JudgeID for Website" — confirming all public website releases have judge IDs removed. The internal VCSC database has JudgeID, but it is NOT present in any of the 5 downloaded public files.

### File Structure Notes
- FY2020: Pure CSV, headers on row 1
- FY2021: XLSX, headers on row 1 (no title row)
- FY2022–2024: XLSX with title row on row 1, long headers on row 2, short var names on row 3, data from row 4+

---

## Maryland MSCCSP

### Files Downloaded
| File | Size | Rows | Columns |
|------|------|------|---------|
| MD_guidelines_data_FULL_CY1999_FY2025.xlsx | 280 MB | ~400,889 | 184 |
| MSCCSP_Database_Codebook.pdf | 382 KB | — | — |
| Data_Download_File_Information.pdf | 264 KB | — | — |

### Date Range
CY1999 – FY2025: January 1, 1999 through June 30, 2025

### Judge ID/Name Fields
**NONE** — Confirmed by both data inspection and codebook review.

Codebook explicitly lists no judge identifier field. The closest fields:
- `CC_WORKSHEET_COMPLETED_BY` — name of person who initiated worksheet (could be a judge's name IF a judge filed it, but is not the sentencing judge identifier)
- `Title_Numeric` — job title of worksheet initiator (one value = "Judge")
- `Circuit` — court circuit number only
- `No_Contact_Ord` — whether judge ordered no contact with victim

Per codebook: "This database does not include any field that reliably identifies the sentencing judge."

---

## Arkansas ADC

### Status: BLOCKED — Paid Subscription Required

The Arkansas Inmate Database is NOT freely downloadable. It is provided through:
- **Service**: Information Network of Arkansas (INA) / Tyler Technologies Bulk Data Subscriber Portal
- **URL**: https://portal.arkansas.gov/tyler-arkansas-subscriber-account/bulk-data/
- **Cost**: $0.10 per record + account registration required
- **Update frequency**: Weekly (posted each Monday)
- **Authentication**: Google reCAPTCHA + account login required

No files were downloaded for Arkansas.

### What Arkansas Data Contains (per public documentation)
The inmate database contains current ADC inmate population data. Based on the public inmate search at https://apps.ark.org/inmate_info/index.php, fields likely include:
- Inmate name, ADC number
- Current facility
- Offense(s) / charge(s)
- County of commitment
- Sentence length
- Projected release date
- Security level

**Judge fields**: Unknown — cannot confirm without accessing the data.
- The DOC's online inmate search at apps.ark.org does NOT display judge information
- The bulk database may or may not include a sentencing judge field

---

## Summary: Judge ID Availability

| State | Has Judge ID? | Notes |
|-------|--------------|-------|
| Virginia FY2020 | ❌ NO | Public release has no judge ID |
| Virginia FY2021 | ❌ NO | Public release has no judge ID |
| Virginia FY2022 | ❌ NO | Public release has no judge ID |
| Virginia FY2023 | ❌ NO | Public release has no judge ID |
| Virginia FY2024 | ❌ NO | Explicitly labeled "without...JudgeID" |
| Maryland CY1999–FY2025 | ❌ NO | Confirmed by codebook |
| Arkansas | ⚠️ UNKNOWN | Could not download — paid service |
