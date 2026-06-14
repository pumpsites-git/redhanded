# RedHanded Data Incoming

This directory is for new data submissions from bounty hunters and data contributors.

## Submission Format

Place files here and the pipeline will detect them on next run.

### JSON Submissions (court case data)

For judge or case data, submit a JSON file with this structure:

```json
{
  "submitter": "your-handle",
  "date": "2026-06-13",
  "source": "Description of data source",
  "state": "FL",
  "county": "Pinellas County",
  "dataType": "cases",  // or "judges" or "sentencing"
  "cases": [
    {
      "caseNumber": "2024-CF-001234",
      "judge": "SMITH, JOHN A",
      "charges": [
        {
          "description": "POSSESSION OF COCAINE",
          "disposition": "Adjudicated Guilty",
          "dispositionDate": "2024-03-15"
        }
      ],
      "courtType": "Criminal Felony"
    }
  ]
}
```

### CSV Submissions (bulk sentencing data)

For bulk sentencing data, submit a CSV with at minimum these columns:
- `judge_name` — Judge's full name
- `sentence_type` — Prison / Probation / Jail / Other
- `offense_category` — Type of offense
- `race` — Defendant race (optional)
- `gender` — Defendant gender (optional)

### FDLE-Format CSV

For Florida FDLE-compatible CSVs, include:
- `Disposition` — Adjudicated Guilty / Adjudication Withheld / G / W
- `COUNTY_DESCRIPTION` — County name
- `Level` — Felony / Misdemeanor
- `SENTENCE_CONFINEMENT` — Prison / County Jail / Community Control / etc.
- `JUDICIAL_CIRCUIT` — Circuit number

## Review Process

**Incoming files are NOT automatically ingested.** A human review step is required:

1. Files placed here are flagged on pipeline run with `📬 Found N file(s) in incoming/`
2. Reviewer validates source authenticity and data format
3. Move validated files to the appropriate `data/raw/` subdirectory
4. Re-run pipeline: `python pipeline/pipeline.py`

## Naming Convention

Name files descriptively:
- `fl-sarasota-cases-2024.json` — Florida Sarasota County 2024 cases
- `il-cook-sentencing-2025-q1.json` — IL Cook County Q1 2025 sentencing
- `tx-harris-judges-2024.csv` — Texas Harris County judge data

## Notes

- Files starting with `_` are ignored (use for staging/temp files)
- This README is also ignored by the pipeline
- Files over 100MB should be symlinked from external storage, not copied
