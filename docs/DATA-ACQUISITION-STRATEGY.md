# RedHanded — Data Acquisition Strategy

## The Discovery: CCIS Has Everything

Florida's **Comprehensive Case Information System (CCIS)**, administered by the **Florida Clerks of Court Corporation (FCCC)**, contains structured files with exactly the data we need:

### CCIS Files That Matter

| File | Key Fields | Why It Matters |
|------|-----------|----------------|
| **Sentence Detail** | UCN, charge_sequence, sentence_sequence, **judge_at_sentence**, sentence_imposed_date, length_of_confinement, type_of_confinement, sentence_status | **This is the holy grail** — judge name linked to every sentence |
| **Judge History** | UCN, **judge_PIN**, **judge_name**, judge_type, assign_date, withdraw_date, FL_Bar_ID | Full judge assignment history per case |
| **Judge Map** | county_code, local_judge_name, standardized_CCIS_name, division | Maps local inconsistent judge names to standard format |
| **Case/Docket** | UCN, county, court_type, filing_date | Master case record |
| **Charges** | UCN, charge_sequence, statute, offense_level, disposition | Individual charges within a case |

### The Join (Production Schema)

```sql
SELECT
  c.ucn,
  c.county_code,
  ch.statute,
  ch.offense_level,
  ch.disposition,
  sd.sentence_imposed_date,
  sd.length_of_confinement,
  sd.type_of_confinement,
  sd.judge_at_sentence,
  jh.judge_name,
  jh.judge_pin,
  jh.fl_bar_id,
  jm.standardized_name
FROM cases c
JOIN charges ch ON c.ucn = ch.ucn
JOIN sentence_detail sd ON ch.ucn = sd.ucn
  AND ch.charge_sequence = sd.charge_sequence
JOIN judge_history jh ON c.ucn = jh.ucn
  AND sd.sentence_imposed_date BETWEEN jh.assign_date AND COALESCE(jh.withdraw_date, CURRENT_DATE)
LEFT JOIN judge_map jm ON c.county_code = jm.county_code
  AND jh.judge_name = jm.local_judge_name;
```

### Linking to FDLE/FDC (OBIS)

CCIS includes OBTS/SID fields for criminal case linkage:
- **OBTS** (Offender Based Transaction Statistics) number
- **SID** (State ID) number

These link to:
- FDLE records (our 3.6M FDLE dataset uses PERSON_ID which may map to SID)
- FDC/OBIS records (DC Number → can cross-reference via case number + county)

### Acquisition Priority

1. **FCCC/CCIS Bulk Data Request** — Request sentence_detail + judge_history + judge_map files. This is ONE request that unlocks judge data for ALL 67 counties statewide.

2. **FDC Scoresheet Request** — Already drafted. Backup path that gets judge names from Criminal Punishment Code scoresheets for prison/supervision sentences only.

3. **OSCA (Office of State Courts Administrator)** — They oversee CCIS. Backup if FCCC doesn't respond.

4. **Individual County Clerks** — Fallback for specific high-value counties. Sunshine Law requests.

5. **Scraping** — Tactical only. BenchmarkWeb scraper for counties where we need data NOW. Not the long-term strategy.

### Why Scraping Is Wrong for Production

- Brittle: portals change their AJAX flows (we just experienced this with Bay County)
- Slow: CAPTCHA solving at 30 sec/solve limits throughput
- Incomplete: name-based search misses unusual names
- Legal risk: may violate terms of service
- Expensive: $3/1000 CAPTCHAs × 1M+ cases = $3,000+

### Why Bulk Data Is Right

- Complete: every case, every county, every judge
- Structured: proper relational schema with UCN keys
- Legal: public records request under Sunshine Law
- One-time: request once, get everything
- Linkable: OBTS/SID fields connect to FDLE and FDC

### Timeline

| Action | When | Expected Result |
|--------|------|-----------------|
| Send FCCC request | Monday AM | Bulk CCIS export within 5-15 business days |
| Send FDC request | Monday AM | Scoresheet judge data within 5-15 business days |
| Bay County scraper | Running NOW | ~1,200 cases with judges by morning |
| Sunshine Law to top 10 counties | This week | County-specific judge data within 10-30 days |
