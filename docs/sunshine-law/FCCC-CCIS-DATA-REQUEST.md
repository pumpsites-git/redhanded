# READY TO SEND — FCCC/CCIS Bulk Data Request

**To:** Florida Clerks of Court Corporation  
**Email:** publicrecords@flccoc.org  
**Subject:** Public Records Request — CCIS Sentence Detail and Judge Assignment Data

---

Dear Public Records Custodian,

Pursuant to Chapter 119, Florida Statutes (Florida's Public Records Act), I am requesting the following records from the Comprehensive Case Information System (CCIS):

### Records Requested

I am requesting bulk data exports of the following CCIS data files for all criminal cases statewide:

**1. Sentence Detail File**
Including: UCN (Uniform Case Number), charge sequence number, sentence sequence number, sentence imposed date, sentence status, length of sentence/confinement, type of confinement, **judge at sentence**, and division.

**2. Judge History File**
Including: UCN, judge PIN, judge name, judge type, assign date, withdraw date, and Florida Bar ID (if available).

**3. Judge Map File**
Including: county code, local judge name/identifier, standardized CCIS display name, and division.

### Scope

All criminal cases (felony and misdemeanor) in the CCIS database. I understand this may be a substantial dataset. I am prepared to accept the data in multiple files or batches if necessary.

### Preferred Format

Tab-delimited text files (.txt), CSV, or any structured export format used for CCIS data distribution. The UCN should be included as the primary key in all files to enable cross-referencing.

### Purpose

This data will be used for public interest research and analysis of judicial sentencing patterns across Florida's counties and circuits. All analysis will use publicly available court record data.

### Cost

I understand there may be a reasonable charge for extensive use of information technology resources per F.S. §119.07(4)(d). Please provide a cost estimate before proceeding. I am willing to pay reasonable costs for this data extract.

### Legal Basis

- All court records in Florida are public records under Article I, Section 24 of the Florida Constitution and F.S. §119.07.
- Judge names and case assignments are matters of public record that appear in open court proceedings and published court orders.
- The CCIS data requested contains no information exempt from public disclosure.

### Contact

Please direct any questions or cost estimates to this email address. I am happy to narrow or clarify this request to facilitate a timely response.

Thank you for your attention to this request.

Sincerely,
Bryan Deering
bryan@yourwarpaint.com

---

## Notes for Bryan

**What FCCC is:** The Florida Clerks of Court Corporation is the entity that administers CCIS — the statewide case management data system that ALL 67 county clerks report into. They have the centralized data.

**Why this is the big one:** The CCIS sentence detail file literally has a field called `judge_at_sentence`. The judge history file has `judge_name`, `judge_PIN`, and assignment dates. The judge map file standardizes names across counties. Together, these three files give us judge-linked sentencing data for every criminal case in Florida.

**The UCN (Uniform Case Number)** is the statewide case identifier. Format: county-year-courttype-sequence-party-branch. This is the key that links everything together.

**Expected response:** Government agencies have varying response times. Some provide bulk data within a week; others may take 30 days. They may ask for clarification or provide a cost estimate first. Costs for large data extracts are typically reasonable ($50-$500 range).

**If FCCC says no or redirects:** Send the same request to the Office of State Courts Administrator (OSCA) at courts@flcourts.org — they oversee CCIS from the judicial branch side.
