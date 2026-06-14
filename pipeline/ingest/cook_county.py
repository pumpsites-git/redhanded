#!/usr/bin/env python3
"""
Cook County IL ingest module.
Processes 305,884 sentencing records → judge profiles.
Ports logic from scripts/build-state-judge-profiles.py.
"""

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any


# ── Classification maps ────────────────────────────────────────────────────────

PRISON_TYPES = {"Prison", "Death"}
JAIL_TYPES = {"Jail", "Cook County Boot Camp"}
PROBATION_TYPES = {
    "Probation", "2nd Chance Probation", "Conditional Discharge",
    "Supervision", "Conditional Release", "Inpatient Mental Health Services",
    "Probation Terminated Satisfactorily", "Probation Terminated Unsatisfactorily",
    "Probation Terminated Instanter",
}

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
    """Build full stats dict for a set of records (one judge or whole court)."""
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

        offense_breakdown[offense]["total"] += 1
        if cat == "prison":
            offense_breakdown[offense]["prison"] += 1
        elif cat == "probation":
            offense_breakdown[offense]["probation"] += 1
        elif cat == "jail":
            offense_breakdown[offense]["jail"] += 1

        if offense in VIOLENT_CATEGORIES:
            violent_total += 1
            if cat == "prison":
                violent_prison += 1
            elif cat == "probation":
                violent_probation += 1
            elif cat == "jail":
                violent_jail += 1

        race_breakdown[race]["total"] += 1
        if cat == "prison":
            race_breakdown[race]["prison"] += 1
        elif cat == "probation":
            race_breakdown[race]["probation"] += 1

        gender_breakdown[gender]["total"] += 1
        if cat == "prison":
            gender_breakdown[gender]["prison"] += 1
        elif cat == "probation":
            gender_breakdown[gender]["probation"] += 1

        days = parse_commitment_days(r.get("commitment_term"), r.get("commitment_unit"))
        if days is not None:
            commitment_days.append(days)

        if facility:
            facilities[facility] += 1

    avg_days = round(sum(commitment_days) / len(commitment_days), 1) if commitment_days else None
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
    Normalized so court average maps to ~50.
    """
    v = judge_stats.get("violentCases", {})
    violent_prob_rate = v.get("probationRate", 0)
    overall_prob_rate = judge_stats.get("probationRate", 0)
    non_prison_rate = 1.0 - judge_stats.get("prisonRate", 0)

    raw = (
        violent_prob_rate * 0.50 +
        overall_prob_rate * 0.30 +
        non_prison_rate * 0.20
    )

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
        score = int((raw / avg_raw) * 50)

    return max(0, min(100, score))


def run(config: dict, project_root: Path) -> dict:
    """
    Process Cook County sentencing data → judge profiles.
    Returns a dict matching state-judges output schema.
    """
    sentencing_path = project_root / config["sources"]["cook_county"]["sentencing"]
    min_cases = config["thresholds"]["min_cases_judge"]

    print(f"  Loading {sentencing_path}...")
    with open(sentencing_path) as f:
        records = json.load(f)
    raw_count = len(records)
    print(f"  Loaded {raw_count:,} records")

    # Group by judge
    by_judge: dict[str, list] = defaultdict(list)
    for r in records:
        judge = r.get("sentence_judge", "").strip()
        if judge:
            by_judge[judge].append(r)

    total_judges_raw = len(by_judge)
    print(f"  Found {total_judges_raw} unique judges")

    # Build stats for judges with >= min_cases
    all_stats = {}
    for judge_name, recs in by_judge.items():
        if len(recs) >= min_cases:
            all_stats[judge_name] = build_judge_stats(recs)

    print(f"  Judges with >= {min_cases} cases: {len(all_stats)}")

    # Court-wide averages
    court_stats = build_judge_stats(records)

    # Build output profiles
    judges_out = {}
    for judge_name, stats in all_stats.items():
        slug = slugify(judge_name)
        leniency = calc_leniency_score(stats, court_stats)
        entry = {
            "name": judge_name,
            "slug": slug,
            "state": "Illinois",
            "stateCode": "IL",
            "county": "Cook County",
            **stats,
            "leniencyScore": leniency,
        }
        judges_out[slug] = entry

    judges_sorted = dict(sorted(judges_out.items(), key=lambda x: -x[1]["leniencyScore"]))

    leniency_scores = [j["leniencyScore"] for j in judges_sorted.values()]
    violent_prison_rates = [
        j["violentCases"]["prisonRate"]
        for j in judges_sorted.values()
        if j.get("violentCases", {}).get("total", 0) >= 5
    ]

    output = {
        "generated": None,  # Set by pipeline
        "source": "Cook County State's Attorney Open Data, 2024-2025",
        "totalJudges": len(judges_sorted),
        "totalCases": raw_count,
        "courtAverage": {
            "prisonRate": court_stats["prisonRate"],
            "jailRate": court_stats["jailRate"],
            "probationRate": court_stats["probationRate"],
            "otherRate": court_stats["otherRate"],
            "violentCases": court_stats["violentCases"],
            "avgCommitmentDays": court_stats["avgCommitmentDays"],
        },
        "summary": {
            "judgesLowViolentPrisonRate": sum(1 for r in violent_prison_rates if r < 0.20),
            "minViolentPrisonRate": round(min(violent_prison_rates), 4) if violent_prison_rates else 0,
            "maxViolentPrisonRate": round(max(violent_prison_rates), 4) if violent_prison_rates else 0,
            "avgLeniencyScore": round(sum(leniency_scores) / len(leniency_scores), 1) if leniency_scores else 0,
        },
        "judges": judges_sorted,
    }

    print(f"  ✓ Cook County: {len(judges_sorted)} judge profiles, {raw_count:,} records")
    print(f"    Court avg — Prison: {court_stats['prisonRate']:.1%}, Probation: {court_stats['probationRate']:.1%}")

    return {
        "profiles": output,
        "raw_count": raw_count,
        "judge_count": len(judges_sorted),
    }
