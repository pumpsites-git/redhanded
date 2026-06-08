#!/usr/bin/env python3
"""
Build Cook County judge profiles from sentencing data.
Calculates leniency scores, sentencing patterns, and demographic breakdowns.
"""

import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

# Paths
BASE = Path(__file__).parent.parent
INPUT = BASE / "data" / "state-courts" / "illinois" / "cook-county-sentencing.json"
OUTPUT = BASE / "data" / "state-courts" / "illinois" / "judge-profiles.json"

# Sentence type classification
PRISON_TYPES = {"Prison", "Death"}
JAIL_TYPES = {"Jail", "Cook County Boot Camp"}
PROBATION_TYPES = {
    "Probation", "2nd Chance Probation", "Conditional Discharge",
    "Supervision", "Conditional Release", "Inpatient Mental Health Services",
    "Probation Terminated Satisfactorily", "Probation Terminated Unsatisfactorily",
    "Probation Terminated Instanter",
}

# Violent offense categories
VIOLENT_CATEGORIES = {
    "UUW - Unlawful Use of Weapon", "Homicide", "Attempt Homicide",
    "Armed Robbery", "Aggravated Battery", "Aggravated Battery With A Firearm",
    "Aggravated Battery Police Officer", "Aggravated Battery Police Officer Firearm",
    "Sex Crimes", "Attempt Sex Crimes", "Vehicular Hijacking",
    "Attempt Vehicular Hijacking", "Home Invasion", "Robbery",
    "Attempt Armed Robbery", "Armed Violence", "Gun Running",
    "Aggravated Assault Police Officer", "Aggravated Assault Police Officer Firearm",
    "Aggravated Robbery", "Aggravated Robbery BB Gun", "Reckless Homicide",
    "Police Shooting", "Disarming Police Officer",
}


def slugify(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r'\s+', '-', name)
    name = re.sub(r'[^a-z0-9\-]', '', name)
    name = re.sub(r'-+', '-', name)
    return name.strip('-')


def classify_sentence(sentence_type: str) -> str:
    if sentence_type in PRISON_TYPES:
        return "prison"
    if sentence_type in JAIL_TYPES:
        return "jail"
    if sentence_type in PROBATION_TYPES:
        return "probation"
    return "other"


def safe_rate(count: int, total: int) -> float:
    if total == 0:
        return 0.0
    return round(count / total, 4)


def parse_commitment_days(term: str, unit: str) -> float | None:
    """Convert commitment term/unit to days."""
    if not term or not unit:
        return None
    try:
        val = float(term)
    except (ValueError, TypeError):
        return None
    unit = unit.lower()
    if 'day' in unit:
        return val
    if 'month' in unit:
        return val * 30.44
    if 'year' in unit:
        return val * 365.25
    return None


def build_judge_stats(records: list[dict]) -> dict:
    """Build full stats dict for a set of records (one judge)."""
    total = len(records)
    if total == 0:
        return {}

    prison = jail = probation = other = 0
    sentence_types: dict[str, int] = defaultdict(int)
    violent_total = violent_prison = violent_probation = violent_jail = 0
    offense_breakdown: dict[str, dict] = defaultdict(lambda: {"total": 0, "prison": 0, "probation": 0, "jail": 0})
    race_breakdown: dict[str, dict] = defaultdict(lambda: {"total": 0, "prison": 0, "probation": 0})
    gender_breakdown: dict[str, dict] = defaultdict(lambda: {"total": 0, "prison": 0, "probation": 0})
    commitment_days: list[float] = []
    facilities: dict[str, int] = defaultdict(int)

    for r in records:
        st = r.get("sentence_type", "")
        cat = classify_sentence(st)
        sentence_types[st] += 1
        offense = r.get("offense_category", "Unknown")
        race = r.get("race", "Unknown") or "Unknown"
        gender = r.get("gender", "Unknown") or "Unknown"
        facility = r.get("court_facility", "") or ""

        if cat == "prison":
            prison += 1
        elif cat == "jail":
            jail += 1
        elif cat == "probation":
            probation += 1
        else:
            other += 1

        # Offense breakdown
        offense_breakdown[offense]["total"] += 1
        if cat == "prison":
            offense_breakdown[offense]["prison"] += 1
        elif cat == "probation":
            offense_breakdown[offense]["probation"] += 1
        elif cat == "jail":
            offense_breakdown[offense]["jail"] += 1

        # Violent cases
        if offense in VIOLENT_CATEGORIES:
            violent_total += 1
            if cat == "prison":
                violent_prison += 1
            elif cat == "probation":
                violent_probation += 1
            elif cat == "jail":
                violent_jail += 1

        # Race
        race_breakdown[race]["total"] += 1
        if cat == "prison":
            race_breakdown[race]["prison"] += 1
        elif cat == "probation":
            race_breakdown[race]["probation"] += 1

        # Gender
        gender_breakdown[gender]["total"] += 1
        if cat == "prison":
            gender_breakdown[gender]["prison"] += 1
        elif cat == "probation":
            gender_breakdown[gender]["probation"] += 1

        # Commitment term
        days = parse_commitment_days(r.get("commitment_term"), r.get("commitment_unit"))
        if days is not None:
            commitment_days.append(days)

        if facility:
            facilities[facility] += 1

    avg_days = round(sum(commitment_days) / len(commitment_days), 1) if commitment_days else None

    # Court facility = most common
    court_facility = max(facilities, key=facilities.get) if facilities else ""

    return {
        "totalCases": total,
        "prisonRate": safe_rate(prison, total),
        "jailRate": safe_rate(jail, total),
        "probationRate": safe_rate(probation, total),
        "otherRate": safe_rate(other, total),
        "prisonCount": prison,
        "jailCount": jail,
        "probationCount": probation,
        "otherCount": other,
        "avgCommitmentDays": avg_days,
        "courtFacility": court_facility,
        "violentCases": {
            "total": violent_total,
            "prisonRate": safe_rate(violent_prison, violent_total),
            "probationRate": safe_rate(violent_probation, violent_total),
            "jailRate": safe_rate(violent_jail, violent_total),
            "prisonCount": violent_prison,
            "probationCount": violent_probation,
        },
        "sentenceTypes": dict(sentence_types),
        "offenseBreakdown": {
            k: {
                "total": v["total"],
                "prison": v["prison"],
                "probation": v["probation"],
                "jail": v["jail"],
                "prisonRate": safe_rate(v["prison"], v["total"]),
                "probationRate": safe_rate(v["probation"], v["total"]),
            }
            for k, v in sorted(offense_breakdown.items(), key=lambda x: -x[1]["total"])
        },
        "raceBreakdown": {
            k: {
                "total": v["total"],
                "prison": v["prison"],
                "probation": v["probation"],
                "prisonRate": safe_rate(v["prison"], v["total"]),
                "probationRate": safe_rate(v["probation"], v["total"]),
            }
            for k, v in sorted(race_breakdown.items(), key=lambda x: -x[1]["total"])
        },
        "genderBreakdown": {
            k: {
                "total": v["total"],
                "prison": v["prison"],
                "probation": v["probation"],
                "prisonRate": safe_rate(v["prison"], v["total"]),
                "probationRate": safe_rate(v["probation"], v["total"]),
            }
            for k, v in sorted(gender_breakdown.items(), key=lambda x: -x[1]["total"])
        },
    }


def calc_leniency_score(judge_stats: dict, court_avg: dict) -> int:
    """
    Leniency Score 0–100. Higher = more lenient (lets more criminals walk).
    Components:
      50% — probation rate for violent offenses
      30% — overall probation rate
      20% — non-prison rate (1 - prison rate)

    Each component is normalized 0–1, weighted, then scaled to 0–100.
    We compare to court averages so scores are relative.
    """
    v = judge_stats.get("violentCases", {})
    violent_prob_rate = v.get("probationRate", 0)
    overall_prob_rate = judge_stats.get("probationRate", 0)
    non_prison_rate = 1.0 - judge_stats.get("prisonRate", 0)

    # Raw weighted score (0–1)
    raw = (
        violent_prob_rate * 0.50 +
        overall_prob_rate * 0.30 +
        non_prison_rate * 0.20
    )

    # Scale: court average maps to ~50
    avg_v = court_avg.get("violentCases", {})
    avg_violent_prob = avg_v.get("probationRate", 0)
    avg_prob = court_avg.get("probationRate", 0)
    avg_non_prison = 1.0 - court_avg.get("prisonRate", 0)
    avg_raw = (
        avg_violent_prob * 0.50 +
        avg_prob * 0.30 +
        avg_non_prison * 0.20
    )

    if avg_raw == 0:
        score = int(raw * 100)
    else:
        # Scale so avg_raw → 50
        score = int((raw / avg_raw) * 50)

    return max(0, min(100, score))


def main():
    print(f"Loading {INPUT}...")
    with open(INPUT) as f:
        records = json.load(f)

    print(f"Loaded {len(records)} records")

    # Group records by judge
    by_judge: dict[str, list] = defaultdict(list)
    for r in records:
        judge = r.get("sentence_judge", "").strip()
        if judge:
            by_judge[judge].append(r)

    print(f"Found {len(by_judge)} judges")

    # Build all judge stats
    all_stats = {}
    for judge_name, recs in by_judge.items():
        all_stats[judge_name] = build_judge_stats(recs)

    # Calculate court-wide averages
    total_records = len(records)
    court_stats = build_judge_stats(records)

    print(f"Court averages — Prison: {court_stats['prisonRate']:.1%}, Probation: {court_stats['probationRate']:.1%}")

    # Calculate leniency scores (requires court averages)
    judges_out = {}
    for judge_name, stats in all_stats.items():
        slug = slugify(judge_name)
        leniency = calc_leniency_score(stats, court_stats)
        entry = {
            "name": judge_name,
            "slug": slug,
            **stats,
            "leniencyScore": leniency,
        }
        judges_out[slug] = entry

    # Sort by leniency score desc
    judges_sorted = dict(
        sorted(judges_out.items(), key=lambda x: -x[1]["leniencyScore"])
    )

    # Compute some summary stats
    leniency_scores = [j["leniencyScore"] for j in judges_sorted.values()]
    judges_low_violent_prison = sum(
        1 for j in judges_sorted.values()
        if j.get("violentCases", {}).get("prisonRate", 1) < 0.20
        and j.get("violentCases", {}).get("total", 0) >= 5
    )

    violent_prison_rates = [
        j["violentCases"]["prisonRate"]
        for j in judges_sorted.values()
        if j.get("violentCases", {}).get("total", 0) >= 5
    ]
    min_violent_prison = round(min(violent_prison_rates), 4) if violent_prison_rates else 0
    max_violent_prison = round(max(violent_prison_rates), 4) if violent_prison_rates else 0

    output = {
        "generated": date.today().isoformat(),
        "source": "Cook County State's Attorney Open Data, 2024-2025",
        "totalJudges": len(judges_sorted),
        "totalCases": total_records,
        "courtAverage": {
            "prisonRate": court_stats["prisonRate"],
            "jailRate": court_stats["jailRate"],
            "probationRate": court_stats["probationRate"],
            "otherRate": court_stats["otherRate"],
            "violentCases": court_stats["violentCases"],
            "avgCommitmentDays": court_stats["avgCommitmentDays"],
        },
        "summary": {
            "judgesLowViolentPrisonRate": judges_low_violent_prison,
            "minViolentPrisonRate": min_violent_prison,
            "maxViolentPrisonRate": max_violent_prison,
            "avgLeniencyScore": round(sum(leniency_scores) / len(leniency_scores), 1) if leniency_scores else 0,
        },
        "judges": judges_sorted,
    }

    print(f"Writing {OUTPUT}...")
    with open(OUTPUT, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Done! {len(judges_sorted)} judges written.")
    print(f"Summary: {judges_low_violent_prison} judges sent <20% of violent offenders to prison")
    print(f"Violent prison rate range: {min_violent_prison:.1%} – {max_violent_prison:.1%}")

    # Print top 5 most lenient
    print("\nTop 5 Most Lenient Judges:")
    for slug, j in list(judges_sorted.items())[:5]:
        vc = j.get("violentCases", {})
        print(f"  {j['name']}: leniency={j['leniencyScore']}, prison={j['prisonRate']:.1%}, violent_prison={vc.get('prisonRate',0):.1%} ({vc.get('total',0)} violent cases)")


if __name__ == "__main__":
    main()
