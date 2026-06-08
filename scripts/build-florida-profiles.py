#!/usr/bin/env python3
"""
Build Florida county-level judicial profiles from FDLE Clerk Case data.
Processes CjdtClerkCase.zip (4.25M records) without extracting to disk.
"""

import zipfile
import csv
import io
import json
import math
import sys
from collections import defaultdict
from datetime import date

DATA_DIR = "data/state-courts/florida/raw"
OUTPUT_PATH = "data/state-courts/florida/county-profiles.json"

# Dispositions to include (sentenced outcomes)
SENTENCED_DISPOSITIONS = {
    "Adjudicated Guilty",
    "Adjudication Withheld",
    "G",   # code shorthand for Adjudicated Guilty seen in data
    "W",   # code shorthand for Withheld
}

# FCIC categories we treat as violent
VIOLENT_CATEGORIES = {
    "Assault",
    "Homicide",
    "Sex Offenses",
    "Robbery",
    "Battery",
    "Sexual Assault",
    "Aggravated Assault",
    "Aggravated Battery",
    "Kidnapping",
    "Murder",
    "Forcible Sex Offenses",
    "Weapons Offenses",
    "Carjacking",
    "Child Abuse",
    "Domestic Violence",
}


def safe_int(val, default=0):
    try:
        v = int(float(val)) if val and val.strip() else default
        return v if v >= 0 else default
    except (ValueError, TypeError):
        return default


def slug(name):
    return name.lower().replace(" ", "-").replace("'", "").replace(".", "")


def build_county_accumulator():
    return {
        "name": "",
        "judicialCircuit": "",
        "totalCases": 0,
        "felonyCases": 0,
        "misdemeanorCases": 0,
        # confinement type counts
        "prisonCount": 0,
        "jailCount": 0,
        "probationOnlyCount": 0,      # no confinement, has probation
        "commCtrlCount": 0,           # community control
        "noConfinementCount": 0,      # nothing / not applicable
        # sentence duration sums (for averages)
        "felonySentenceDaysSum": 0,
        "felonySentenceDaysCount": 0,
        "misdSentenceDaysSum": 0,
        "misdSentenceDaysCount": 0,
        # violent crime
        "violentCases": 0,
        "violentPrisonCount": 0,
        "violentJailCount": 0,
        "violentProbationOnlyCount": 0,
        # race breakdown
        "raceBreakdown": defaultdict(int),
        # withheld adjudication count
        "withheldCount": 0,
    }


def classify_confinement(row):
    """Return canonical confinement category string."""
    conf = (row.get("SENTENCE_CONFINEMENT") or "").strip()
    if "Prison" in conf:
        return "prison"
    if "County Jail" in conf or "Jail" in conf:
        return "jail"
    if "Community Control" in conf or "Comm Ctrl" in conf:
        return "commCtrl"
    # No active confinement — check if probation-only
    prob = safe_int(row.get("SENTENCE_PROBATION_DURATION_DAYS"))
    comm = safe_int(row.get("SENTENCE_COMM_CTRL_DURATION_DAYS"))
    if comm > 0:
        return "commCtrl"
    if prob > 0:
        return "probationOnly"
    return "none"


def process_row(row, counties):
    disp = (row.get("Disposition") or "").strip()
    if disp not in SENTENCED_DISPOSITIONS:
        return

    county_name = (row.get("COUNTY_DESCRIPTION") or "").strip()
    if not county_name or county_name.upper() in ("NULL", ""):
        return

    c = counties[county_name]
    if not c["name"]:
        c["name"] = county_name
        c["judicialCircuit"] = (row.get("JUDICIAL_CIRCUIT") or "").strip()

    c["totalCases"] += 1

    level = (row.get("Level") or "").strip()
    is_felony = level == "Felony"
    is_misd = level == "Misdemeanor"
    if is_felony:
        c["felonyCases"] += 1
    elif is_misd:
        c["misdemeanorCases"] += 1

    if disp in ("Adjudication Withheld", "W"):
        c["withheldCount"] += 1

    # Confinement
    conf_cat = classify_confinement(row)
    if conf_cat == "prison":
        c["prisonCount"] += 1
    elif conf_cat == "jail":
        c["jailCount"] += 1
    elif conf_cat == "commCtrl":
        c["commCtrlCount"] += 1
    elif conf_cat == "probationOnly":
        c["probationOnlyCount"] += 1
    else:
        c["noConfinementCount"] += 1

    # Sentence duration (use max term as primary)
    max_days = safe_int(row.get("MAXIMUM_TERM_DURATION_DAYS"))
    if max_days > 0 and max_days < 36500:  # cap at 100 years (data sanity)
        if is_felony:
            c["felonySentenceDaysSum"] += max_days
            c["felonySentenceDaysCount"] += 1
        elif is_misd:
            c["misdSentenceDaysSum"] += max_days
            c["misdSentenceDaysCount"] += 1

    # Violent crime
    fcic = (row.get("FCIC_Category") or "").strip()
    is_violent = any(v.lower() in fcic.lower() for v in VIOLENT_CATEGORIES)
    if is_violent:
        c["violentCases"] += 1
        if conf_cat == "prison":
            c["violentPrisonCount"] += 1
        elif conf_cat == "jail":
            c["violentJailCount"] += 1
        else:
            c["violentProbationOnlyCount"] += 1

    # Race
    race = (row.get("Race") or "Unknown").strip()
    if not race or race.upper() in ("NULL", ""):
        race = "Unknown"
    c["raceBreakdown"][race] += 1


def compute_leniency(county, state_avg):
    """
    Leniency score 0-100 (100 = most lenient).
    Based on:
      - prison rate relative to state avg (lower prison rate → more lenient)
      - withheld adjudication rate (higher → more lenient)
      - average sentence days for felonies (lower → more lenient)
    """
    total = county["totalCases"]
    if total == 0:
        return 50

    prison_rate = county["prisonCount"] / total
    withheld_rate = county["withheldCount"] / total
    avg_felony_days = (
        county["felonySentenceDaysSum"] / county["felonySentenceDaysCount"]
        if county["felonySentenceDaysCount"] > 0
        else state_avg["avgFelonyDays"]
    )

    # Normalize each component to 0-1 range relative to state avg
    # prison_rate: lower is more lenient
    pr_state = state_avg["prisonRate"]
    if pr_state > 0:
        prison_component = 1 - (prison_rate / (pr_state * 2))  # 0 when 2x state avg
    else:
        prison_component = 0.5
    prison_component = max(0, min(1, prison_component))

    # withheld_rate: higher is more lenient
    wh_state = state_avg["withheldRate"]
    if wh_state > 0:
        withheld_component = withheld_rate / (wh_state * 2)
    else:
        withheld_component = 0.5
    withheld_component = max(0, min(1, withheld_component))

    # avg felony days: lower is more lenient
    if state_avg["avgFelonyDays"] > 0:
        days_component = 1 - (avg_felony_days / (state_avg["avgFelonyDays"] * 2))
    else:
        days_component = 0.5
    days_component = max(0, min(1, days_component))

    # Weighted average: prison rate matters most
    score = (prison_component * 0.5) + (withheld_component * 0.3) + (days_component * 0.2)
    return round(score * 100, 1)


def main():
    zip_path = f"{DATA_DIR}/CjdtClerkCase.zip"
    print(f"Opening {zip_path}...")

    counties = defaultdict(build_county_accumulator)
    total_processed = 0
    total_rows = 0

    with zipfile.ZipFile(zip_path) as zf:
        csv_files = sorted([f for f in zf.namelist() if f.endswith(".csv")])
        print(f"Found {len(csv_files)} CSV files")

        for csv_name in csv_files:
            file_count = 0
            file_processed = 0
            print(f"  Processing {csv_name}...", end="", flush=True)

            with zf.open(csv_name) as raw:
                reader = csv.DictReader(
                    io.TextIOWrapper(raw, encoding="utf-8", errors="replace")
                )
                for row in reader:
                    file_count += 1
                    disp = (row.get("Disposition") or "").strip()
                    if disp in SENTENCED_DISPOSITIONS:
                        process_row(row, counties)
                        file_processed += 1

            total_rows += file_count
            total_processed += file_processed
            print(f" {file_count:,} rows, {file_processed:,} sentenced")

    print(f"\nTotal: {total_rows:,} rows read, {total_processed:,} sentenced cases")
    print(f"Counties found: {len(counties)}")

    # ── Compute state averages ──────────────────────────────────────────────
    state_total = sum(c["totalCases"] for c in counties.values())
    state_prison = sum(c["prisonCount"] for c in counties.values())
    state_jail = sum(c["jailCount"] for c in counties.values())
    state_prob = sum(c["probationOnlyCount"] for c in counties.values())
    state_cc = sum(c["commCtrlCount"] for c in counties.values())
    state_withheld = sum(c["withheldCount"] for c in counties.values())
    state_felony_days = sum(c["felonySentenceDaysSum"] for c in counties.values())
    state_felony_days_n = sum(c["felonySentenceDaysCount"] for c in counties.values())
    state_violent = sum(c["violentCases"] for c in counties.values())

    state_avg = {
        "prisonRate": state_prison / state_total if state_total else 0,
        "jailRate": state_jail / state_total if state_total else 0,
        "probationRate": state_prob / state_total if state_total else 0,
        "commCtrlRate": state_cc / state_total if state_total else 0,
        "withheldRate": state_withheld / state_total if state_total else 0,
        "avgFelonyDays": state_felony_days / state_felony_days_n if state_felony_days_n else 0,
        "violentRate": state_violent / state_total if state_total else 0,
    }

    # ── Build output counties dict ──────────────────────────────────────────
    output_counties = {}
    for county_name, c in sorted(counties.items()):
        if c["totalCases"] < 10:  # skip tiny/bad data
            continue
        total = c["totalCases"]
        s = slug(county_name)

        # Violent stats
        vt = c["violentCases"]
        violent_prison_rate = c["violentPrisonCount"] / vt if vt else 0
        violent_jail_rate = c["violentJailCount"] / vt if vt else 0
        violent_other_rate = c["violentProbationOnlyCount"] / vt if vt else 0

        # Avg sentence days
        avg_felony_days = (
            round(c["felonySentenceDaysSum"] / c["felonySentenceDaysCount"], 1)
            if c["felonySentenceDaysCount"] > 0
            else None
        )
        avg_misd_days = (
            round(c["misdSentenceDaysSum"] / c["misdSentenceDaysCount"], 1)
            if c["misdSentenceDaysCount"] > 0
            else None
        )

        # Race breakdown as percentages
        race_total = sum(c["raceBreakdown"].values())
        race_pct = {
            race: round(cnt / race_total, 4)
            for race, cnt in sorted(c["raceBreakdown"].items(), key=lambda x: -x[1])
        } if race_total else {}

        leniency = compute_leniency(c, state_avg)

        output_counties[s] = {
            "name": county_name,
            "slug": s,
            "judicialCircuit": c["judicialCircuit"],
            "totalCases": total,
            "felonyCases": c["felonyCases"],
            "misdemeanorCases": c["misdemeanorCases"],
            "felonyRatio": round(c["felonyCases"] / total, 4) if total else 0,
            "prisonRate": round(c["prisonCount"] / total, 4),
            "jailRate": round(c["jailCount"] / total, 4),
            "probationRate": round(c["probationOnlyCount"] / total, 4),
            "commCtrlRate": round(c["commCtrlCount"] / total, 4),
            "noConfinementRate": round(c["noConfinementCount"] / total, 4),
            "withheldAdjudicationRate": round(c["withheldCount"] / total, 4),
            "avgFelonySentenceDays": avg_felony_days,
            "avgMisdSentenceDays": avg_misd_days,
            "violentCases": {
                "total": vt,
                "rate": round(vt / total, 4) if total else 0,
                "prisonRate": round(violent_prison_rate, 4),
                "jailRate": round(violent_jail_rate, 4),
                "otherRate": round(violent_other_rate, 4),
            },
            "raceBreakdown": race_pct,
            "leniencyScore": leniency,
        }

    # ── Sort & rank ─────────────────────────────────────────────────────────
    sorted_by_leniency = sorted(
        output_counties.items(), key=lambda x: x[1]["leniencyScore"], reverse=True
    )
    rank = 1
    for k, v in sorted_by_leniency:
        output_counties[k]["leniencyRank"] = rank
        rank += 1

    # ── Final output ────────────────────────────────────────────────────────
    output = {
        "generated": str(date.today()),
        "source": "FDLE Criminal Justice Data Transparency, Clerk of Court Reports",
        "totalCounties": len(output_counties),
        "totalCases": total_processed,
        "stateAverage": {
            "prisonRate": round(state_avg["prisonRate"], 4),
            "jailRate": round(state_avg["jailRate"], 4),
            "probationRate": round(state_avg["probationRate"], 4),
            "commCtrlRate": round(state_avg["commCtrlRate"], 4),
            "withheldAdjudicationRate": round(state_avg["withheldRate"], 4),
            "avgFelonySentenceDays": round(state_avg["avgFelonyDays"], 1),
            "violentCaseRate": round(state_avg["violentRate"], 4),
        },
        "counties": output_counties,
    }

    import os
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {OUTPUT_PATH}")
    print(f"\n{'─'*60}")
    print("KEY FINDINGS")
    print(f"{'─'*60}")
    print(f"Total sentenced cases: {total_processed:,}")
    print(f"Counties analyzed:     {len(output_counties)}")
    print()
    print(f"State averages:")
    sa = output["stateAverage"]
    print(f"  Prison rate:              {sa['prisonRate']*100:.1f}%")
    print(f"  Jail rate:                {sa['jailRate']*100:.1f}%")
    print(f"  Probation-only rate:      {sa['probationRate']*100:.1f}%")
    print(f"  Withheld adjudication:    {sa['withheldAdjudicationRate']*100:.1f}%")
    print(f"  Avg felony sentence days: {sa['avgFelonySentenceDays']:.0f}")
    print()

    print("TOP 10 MOST LENIENT COUNTIES:")
    for i, (k, v) in enumerate(sorted_by_leniency[:10], 1):
        print(f"  {i:2}. {v['name']:<20} score={v['leniencyScore']:5.1f}  prison={v['prisonRate']*100:4.1f}%  withheld={v['withheldAdjudicationRate']*100:4.1f}%  cases={v['totalCases']:,}")

    print()
    print("TOP 10 TOUGHEST COUNTIES (least lenient):")
    toughest = sorted(output_counties.items(), key=lambda x: x[1]["leniencyScore"])
    for i, (k, v) in enumerate(toughest[:10], 1):
        print(f"  {i:2}. {v['name']:<20} score={v['leniencyScore']:5.1f}  prison={v['prisonRate']*100:4.1f}%  withheld={v['withheldAdjudicationRate']*100:4.1f}%  cases={v['totalCases']:,}")

    # Palm Beach spotlight
    pb = output_counties.get("palm-beach")
    if pb:
        print()
        print("PALM BEACH COUNTY:")
        print(f"  Total cases:          {pb['totalCases']:,}")
        print(f"  Felony cases:         {pb['felonyCases']:,}")
        print(f"  Prison rate:          {pb['prisonRate']*100:.1f}%  (state avg {sa['prisonRate']*100:.1f}%)")
        print(f"  Jail rate:            {pb['jailRate']*100:.1f}%")
        print(f"  Probation-only rate:  {pb['probationRate']*100:.1f}%")
        print(f"  Withheld adjud rate:  {pb['withheldAdjudicationRate']*100:.1f}%")
        print(f"  Avg felony sentence:  {pb['avgFelonySentenceDays']} days")
        print(f"  Leniency score:       {pb['leniencyScore']} / 100  (rank #{pb['leniencyRank']} of {len(output_counties)})")


if __name__ == "__main__":
    main()
