#!/usr/bin/env python3
"""
Fetch Cook County State's Attorney Open Data from Socrata
Endpoints: Felony Cases, Sentencing, Intake
Date range: 2024-2025
"""

import json
import urllib.request
import urllib.parse
import sys
import os
from collections import defaultdict, Counter
from datetime import datetime

OUT_DIR = "/root/.openclaw/workspace/redhanded/data/state-courts/illinois"
os.makedirs(OUT_DIR, exist_ok=True)

BASE_URL = "https://datacatalog.cookcountyil.gov/resource"

ENDPOINTS = {
    "dispositions": "apwk-dzx8",
    "sentencing": "tg8v-tm6u",
    "intake": "3k7z-hchi",
}

# Date filter strategies to try for each endpoint
DATE_FIELDS = {
    "dispositions": ["disposition_date", "arrest_date", "received_date"],
    "sentencing": ["sentence_date", "disposition_date", "arrest_date"],
    "intake": ["received_date", "arrest_date", "felony_review_date"],
}

LIMIT = 50000

def fetch_url(url):
    print(f"  GET {url[:120]}...")
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))

def fetch_dataset(name, resource_id, date_field, year_start="2024"):
    """Fetch up to LIMIT records with a date filter."""
    where = f"{date_field} >= '{year_start}-01-01T00:00:00'"
    params = urllib.parse.urlencode({
        "$limit": LIMIT,
        "$where": where,
        "$order": f"{date_field} DESC",
    })
    url = f"{BASE_URL}/{resource_id}.json?{params}"
    try:
        data = fetch_url(url)
        print(f"  ✓ {name} via {date_field}: {len(data)} records")
        return data
    except Exception as e:
        print(f"  ✗ {name} via {date_field}: {e}")
        return None

def fetch_all():
    results = {}
    
    for name, resource_id in ENDPOINTS.items():
        print(f"\n--- Fetching {name} ({resource_id}) ---")
        data = None
        for date_field in DATE_FIELDS[name]:
            data = fetch_dataset(name, resource_id, date_field)
            if data and len(data) > 0:
                break
        
        if not data:
            # Fallback: no date filter, just get most recent
            print(f"  Trying fallback (no date filter)...")
            try:
                params = urllib.parse.urlencode({"$limit": 10000, "$order": ":id DESC"})
                url = f"{BASE_URL}/{resource_id}.json?{params}"
                data = fetch_url(url)
                print(f"  ✓ {name} fallback: {len(data)} records")
            except Exception as e:
                print(f"  ✗ {name} fallback failed: {e}")
                data = []
        
        results[name] = data or []
    
    return results

def parse_date(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00").replace(".000", ""))
    except:
        return None

def filter_2024_2025(records, date_fields):
    """Keep only records with a date in 2024 or 2025."""
    kept = []
    for r in records:
        for f in date_fields:
            v = r.get(f)
            if v:
                d = parse_date(v)
                if d and d.year in (2024, 2025):
                    kept.append(r)
                    break
    return kept

def build_summary(dispositions, sentencing, intake):
    """Build analytics summary from the three datasets."""
    summary = {}
    
    # ---- DISPOSITIONS ----
    d_filtered = filter_2024_2025(dispositions, ["disposition_date", "arrest_date", "received_date"])
    summary["dispositions"] = {
        "total_records": len(d_filtered),
        "raw_pulled": len(dispositions),
    }
    
    if d_filtered:
        # Offense breakdown
        offense_counter = Counter(r.get("updated_offense_category") or r.get("offense_category", "Unknown") for r in d_filtered)
        summary["dispositions"]["offense_categories"] = dict(offense_counter.most_common(20))
        
        # Charge disposition types
        disp_counter = Counter(r.get("charge_disposition", "Unknown") for r in d_filtered)
        summary["dispositions"]["charge_dispositions"] = dict(disp_counter.most_common(20))
        
        # Plea breakdown
        plea_types = {"guilty_plea": 0, "nolle": 0, "not_guilty": 0, "conviction": 0, "other": 0}
        for r in d_filtered:
            cd = (r.get("charge_disposition") or "").lower()
            if "plea" in cd or "guilty plea" in cd:
                plea_types["guilty_plea"] += 1
            elif "nolle" in cd:
                plea_types["nolle"] += 1
            elif "not guilty" in cd or "acquitted" in cd:
                plea_types["not_guilty"] += 1
            elif "finding guilty" in cd or "verdict guilty" in cd or "conviction" in cd:
                plea_types["conviction"] += 1
            else:
                plea_types["other"] += 1
        summary["dispositions"]["plea_breakdown"] = plea_types
        
        # Judge breakdown
        judge_counter = Counter(r.get("judge", "Unknown") for r in d_filtered)
        summary["dispositions"]["judges"] = dict(judge_counter.most_common(25))
        
        # Charge class (felony severity)
        class_counter = Counter(r.get("disposition_charged_class", "Unknown") for r in d_filtered)
        summary["dispositions"]["charge_classes"] = dict(class_counter.most_common(15))
        
        # Demographics
        race_counter = Counter(r.get("race", "Unknown") for r in d_filtered)
        gender_counter = Counter(r.get("gender", "Unknown") for r in d_filtered)
        summary["dispositions"]["race_breakdown"] = dict(race_counter)
        summary["dispositions"]["gender_breakdown"] = dict(gender_counter)
        
        # Law enforcement agencies
        lea_counter = Counter(r.get("law_enforcement_agency", "Unknown") for r in d_filtered)
        summary["dispositions"]["law_enforcement_agencies"] = dict(lea_counter.most_common(15))
        
        # Court facilities
        court_counter = Counter(r.get("court_facility", "Unknown") for r in d_filtered)
        summary["dispositions"]["court_facilities"] = dict(court_counter)
        
        # Primary charge only
        primary_records = [r for r in d_filtered if str(r.get("primary_charge", "")).lower() == "true"]
        summary["dispositions"]["primary_charge_records"] = len(primary_records)
    
    # ---- SENTENCING ----
    s_filtered = filter_2024_2025(sentencing, ["sentence_date", "disposition_date", "arrest_date"])
    summary["sentencing"] = {
        "total_records": len(s_filtered),
        "raw_pulled": len(sentencing),
    }
    
    if s_filtered:
        sent_type_counter = Counter(r.get("sentence_type", "Unknown") for r in s_filtered)
        summary["sentencing"]["sentence_types"] = dict(sent_type_counter.most_common(20))
        
        commitment_counter = Counter(r.get("commitment_type", "Unknown") for r in s_filtered)
        summary["sentencing"]["commitment_types"] = dict(commitment_counter.most_common(15))
        
        phase_counter = Counter(r.get("sentence_phase", "Unknown") for r in s_filtered)
        summary["sentencing"]["sentence_phases"] = dict(phase_counter)
        
        # Case length stats
        lengths = []
        for r in s_filtered:
            v = r.get("length_of_case_in_days")
            if v:
                try:
                    lengths.append(int(v))
                except:
                    pass
        if lengths:
            lengths.sort()
            n = len(lengths)
            summary["sentencing"]["case_length_days"] = {
                "count": n,
                "min": lengths[0],
                "max": lengths[-1],
                "median": lengths[n // 2],
                "mean": round(sum(lengths) / n, 1),
                "p25": lengths[n // 4],
                "p75": lengths[3 * n // 4],
            }
        
        # Sentence judge
        judge_counter = Counter(r.get("sentence_judge", "Unknown") for r in s_filtered)
        summary["sentencing"]["judges"] = dict(judge_counter.most_common(25))
        
        # Commitment terms for prison sentences
        prison = [r for r in s_filtered if (r.get("commitment_type") or "").lower().find("corrections") >= 0]
        summary["sentencing"]["prison_sentences"] = len(prison)
        
        terms = []
        for r in prison:
            term = r.get("commitment_term")
            unit = r.get("commitment_unit", "").lower()
            if term:
                try:
                    t = float(term)
                    if "year" in unit:
                        terms.append(t)
                    elif "month" in unit:
                        terms.append(t / 12)
                except:
                    pass
        if terms:
            terms.sort()
            n = len(terms)
            summary["sentencing"]["prison_term_years"] = {
                "count": n,
                "min": round(terms[0], 1),
                "max": round(terms[-1], 1),
                "median": round(terms[n // 2], 1),
                "mean": round(sum(terms) / n, 1),
            }
        
        # Demographics
        race_counter = Counter(r.get("race", "Unknown") for r in s_filtered)
        summary["sentencing"]["race_breakdown"] = dict(race_counter)
        summary["sentencing"]["offense_categories"] = dict(
            Counter(r.get("updated_offense_category") or r.get("offense_category", "Unknown") for r in s_filtered).most_common(20)
        )
    
    # ---- INTAKE ----
    i_filtered = filter_2024_2025(intake, ["received_date", "arrest_date", "felony_review_date"])
    summary["intake"] = {
        "total_records": len(i_filtered),
        "raw_pulled": len(intake),
    }
    
    if i_filtered:
        status_counter = Counter(r.get("participant_status", "Unknown") for r in i_filtered)
        summary["intake"]["participant_statuses"] = dict(status_counter.most_common(20))
        
        review_counter = Counter(r.get("felony_review_result", "Unknown") for r in i_filtered)
        summary["intake"]["felony_review_results"] = dict(review_counter.most_common(15))
        
        offense_counter = Counter(r.get("update_offense_category") or r.get("offense_category", "Unknown") for r in i_filtered)
        summary["intake"]["offense_categories"] = dict(offense_counter.most_common(20))
        
        race_counter = Counter(r.get("race", "Unknown") for r in i_filtered)
        summary["intake"]["race_breakdown"] = dict(race_counter)
        
        lea_counter = Counter(r.get("law_enforcement_agency", "Unknown") for r in i_filtered)
        summary["intake"]["law_enforcement_agencies"] = dict(lea_counter.most_common(15))
    
    summary["generated_at"] = datetime.utcnow().isoformat() + "Z"
    summary["date_range"] = "2024-2025"
    summary["source"] = "Cook County State's Attorney Office - Socrata Open Data"
    
    return summary


def main():
    print("=== Cook County State's Attorney Data Fetcher ===\n")
    
    all_data = fetch_all()
    
    # Save raw data
    for name, records in all_data.items():
        out_path = os.path.join(OUT_DIR, f"cook-county-{name}.json")
        with open(out_path, "w") as f:
            json.dump(records, f, indent=2)
        print(f"\nSaved {len(records)} {name} records → {out_path}")
    
    # Build summary
    print("\n=== Building Analytics Summary ===")
    summary = build_summary(
        all_data.get("dispositions", []),
        all_data.get("sentencing", []),
        all_data.get("intake", []),
    )
    
    summary_path = os.path.join(OUT_DIR, "cook-county-summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved summary → {summary_path}")
    
    # Also save dispositions as the canonical "felonies" file
    felony_path = os.path.join(OUT_DIR, "cook-county-felonies.json")
    with open(felony_path, "w") as f:
        json.dump(all_data.get("dispositions", []), f, indent=2)
    print(f"Saved felonies alias → {felony_path}")
    
    # Print final summary
    print("\n" + "="*60)
    print("COOK COUNTY DATA PULL RESULTS")
    print("="*60)
    for ds_name in ["dispositions", "sentencing", "intake"]:
        ds = summary.get(ds_name, {})
        raw = ds.get("raw_pulled", 0)
        filtered = ds.get("total_records", 0)
        print(f"\n{ds_name.upper()}:")
        print(f"  Raw pulled:       {raw:,}")
        print(f"  2024-2025 filter: {filtered:,}")
        
        if ds_name == "dispositions" and filtered:
            print(f"  Top offenses:")
            for cat, cnt in list(ds.get("offense_categories", {}).items())[:5]:
                print(f"    {cat}: {cnt:,}")
            print(f"  Plea breakdown:   {ds.get('plea_breakdown', {})}")
            print(f"  Top judges:       {list(ds.get('judges', {}).keys())[:3]}")
        
        if ds_name == "sentencing" and filtered:
            print(f"  Prison sentences: {ds.get('prison_sentences', 0):,}")
            if "prison_term_years" in ds:
                pt = ds["prison_term_years"]
                print(f"  Prison terms:     median={pt['median']}yr mean={pt['mean']}yr max={pt['max']}yr")
            if "case_length_days" in ds:
                cl = ds["case_length_days"]
                print(f"  Case length:      median={cl['median']}d mean={cl['mean']}d")
        
        if ds_name == "intake" and filtered:
            print(f"  Review results:   {ds.get('felony_review_results', {})}")
    
    print("\n✅ Done!")

if __name__ == "__main__":
    main()
