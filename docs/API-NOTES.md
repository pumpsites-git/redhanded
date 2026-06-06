# CourtListener API Notes — RedHanded

## Authentication
- Token auth: `Authorization: Token <token>`
- Token: `30afa00471b5a588781fab533d3fbe8d764daadc`

## Rate Limits (FREE TIER)
- **5 requests/minute**
- **50 requests/hour**  
- **125 requests/day**
- Rolling window basis
- Can upgrade via Free Law Project membership or commercial agreement

## Key Endpoints

### Judge Data
- `/api/rest/v4/people/` — Judge bios (person-centric, includes aliases)
- `/api/rest/v4/positions/` — Positions held (judge, president, etc.)
- `/api/rest/v4/political-affiliations/` — Party affiliations
- `/api/rest/v4/educations/` — Schools, degrees
- `/api/rest/v4/aba-ratings/` — ABA ratings
- `/api/rest/v4/retention-events/` — Retention votes, reappointments

### Case Law
- `/api/rest/v4/dockets/` — Case metadata (court, dates, parties)
- `/api/rest/v4/clusters/` — Opinion clusters (groups of opinions per case)
- `/api/rest/v4/opinions/` — Individual opinion text
- `/api/rest/v4/opinions-cited/` — Citation graph

### PACER
- `/api/rest/v4/docket-entries/` — Docket entries
- `/api/rest/v4/recap-documents/` — PACER documents

### Search (different engine — not Django REST filters)
- `/api/rest/v4/search/?type=o` — Case law opinions
- `/api/rest/v4/search/?type=r` — Federal cases (dockets)
- `/api/rest/v4/search/?type=p` — Judges
- `/api/rest/v4/search/?type=oa` — Oral arguments

## Query Refinement
- **Filtering**: Use double underscore (`__`) for lookups: `id__gt=500`, `court__jurisdiction=FD`
- **Related Filters**: Cross-join filtering: `cluster__docket__court=scotus`
- **Exclusion**: Prepend `!`: `court__jurisdiction!=F`
- **Ordering**: `order_by=-date_start` (minus = descending)
- **Counting**: Add `count=on` for just the count
- **Field Selection**: `fields=name_first,name_last` to limit response
- **Omit Fields**: `omit=educations__degree_detail`
- **Pagination**: Cursor-based (v4), max 100 pages with page-based

## Data Model (Case Law)
```
Court → Docket → Cluster → Opinion(s)
                    ↑
              panel (judges)
              citations
```

- `assigned_to` on Docket links to People (judge)
- `panel` on Cluster links to judges who heard the case
- `judges` string field on Cluster = raw text when not normalized

## Key Insights for RedHanded

### Getting cases per judge:
1. **Via Dockets**: Filter `dockets/?assigned_to=<person_id>` — gives cases assigned to that judge
2. **Via Search**: `search/?type=o&judge=<name>` — search opinions by judge name
3. **Via Clusters**: `clusters/?panel=<person_id>` — cases where judge was on panel (appellate)

### For scoring, we need:
- **Case count per judge**: dockets assigned_to filter
- **Opinion count**: clusters with panel filter  
- **Reversal rate**: Compare district → appellate outcomes (complex cross-reference)
- **Citation count**: opinions-cited endpoint shows how often a judge's opinions are cited (quality signal)

### Rate limit strategy:
- 125 calls/day = ~5/hour sustained
- Batch fetches with field selection to minimize calls
- Cache aggressively — judge data doesn't change often
- Use bulk data for initial load, API for updates

### Bulk Data Alternative
- CSV bulk downloads available for large datasets
- Database replication for organizations (paid)
- Better for initial data load than API crawling
