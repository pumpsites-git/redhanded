#!/usr/bin/env python3
"""
Federal judges ingest module.
Processes CourtListener JSON → federal judge profiles.
"""

import json
import re
from pathlib import Path


PARTY_MAP = {
    "Democratic": "Democrat",
    "Democrat": "Democrat",
    "Republican": "Republican",
    "Independent": "Independent",
    "None": None,
    "Unknown": None,
}

STATUS_ACTIVE = {"Active", "Senior Status"}

COURT_TYPE_MAP = {
    "district-court": "U.S. District Court",
    "circuit-court": "U.S. Court of Appeals",
    "supreme-court": "U.S. Supreme Court",
    "bankruptcy-court": "U.S. Bankruptcy Court",
    "magistrate": "U.S. Magistrate",
    "court-of-federal-claims": "U.S. Court of Federal Claims",
    "court-of-international-trade": "U.S. Court of International Trade",
    "tax-court": "U.S. Tax Court",
    "military-court": "Military Court",
    "state-court": "State Court",
}


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'[^a-z0-9\-]', '', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')


def extract_primary_position(positions: list[dict]) -> dict:
    """Extract the most relevant (latest/active) position."""
    if not positions:
        return {}

    # Prefer active federal positions
    federal = [p for p in positions if p.get("court_type") in (
        "district-court", "circuit-court", "supreme-court",
        "bankruptcy-court", "magistrate", "court-of-federal-claims",
        "court-of-international-trade"
    )]

    if federal:
        # Sort: active first, then by date_start desc
        def pos_sort(p):
            active = 1 if p.get("date_termination") is None else 0
            start = p.get("date_start") or "0000"
            return (active, start)
        federal.sort(key=pos_sort, reverse=True)
        return federal[0]

    return positions[0] if positions else {}


def run(config: dict, project_root: Path) -> dict:
    """
    Process CourtListener data → federal judge profiles.
    Returns clean dict of judges.
    """
    cl_path = project_root / config["sources"]["federal"]["courtlistener"]

    print(f"  Loading {cl_path}...")
    with open(cl_path) as f:
        data = json.load(f)

    raw_judges = data.get("judges", [])
    total_raw = len(raw_judges)
    print(f"  Loaded {total_raw:,} raw CourtListener entries")

    output_judges: list[dict] = []
    court_counts: dict[str, int] = {}

    for judge in raw_judges:
        name = judge.get("name", "").strip()
        if not name:
            continue

        positions = judge.get("positions", []) or []
        primary = extract_primary_position(positions)

        court_id = primary.get("court_id", "") or ""
        court_name = primary.get("court", "") or ""
        court_type = primary.get("court_type", "") or ""
        court_full = COURT_TYPE_MAP.get(court_type, court_type)

        # Determine status
        is_active = primary.get("date_termination") is None and bool(primary)
        job_title = (primary.get("job_title") or "").lower()
        if "senior" in job_title:
            status = "Senior"
        elif "retired" in job_title or not is_active:
            status = "Retired"
        elif "chief" in job_title:
            status = "Chief"
        else:
            status = "Active" if is_active else "Retired"

        # Appointing president / party
        appointing_president = primary.get("appointing_president") or ""
        party_raw = primary.get("party_affiliation") or ""
        party = PARTY_MAP.get(party_raw, party_raw if party_raw else None)

        # Year started
        date_start = primary.get("date_start") or ""
        year_started = int(date_start[:4]) if date_start and len(date_start) >= 4 else None
        current_year = 2026
        years_serving = (current_year - year_started) if year_started else None

        # State
        state = primary.get("state_code") or ""

        # Education
        education = judge.get("education") or []
        if isinstance(education, list):
            education = "; ".join(str(e) for e in education)

        # Race/gender
        gender = (judge.get("gender") or "").title()
        race = judge.get("race") or []

        slug = slugify(name)

        # Track court counts
        if court_id:
            court_counts[court_id] = court_counts.get(court_id, 0) + 1

        output_judges.append({
            "id": judge.get("id"),
            "clId": judge.get("id"),
            "name": name,
            "slug": slug,
            "gender": gender,
            "race": race,
            "court": court_id,
            "courtFull": court_name or court_full,
            "courtId": court_id,
            "courtType": court_full,
            "jurisdiction": "federal",
            "state": state,
            "status": status,
            "isActive": is_active,
            "appointedBy": appointing_president,
            "party": party,
            "yearStarted": year_started,
            "yearsServing": years_serving,
            "education": education,
            "abaRating": None,
            "confirmationVotesYes": None,
            "confirmationVotesNo": None,
            "hasPhoto": False,
            "photoUrl": None,
            "accountabilityScore": None,
            "stats": None,
        })

    # Build district-level aggregates
    by_court: dict[str, list] = {}
    for j in output_judges:
        c = j["court"]
        if c:
            if c not in by_court:
                by_court[c] = []
            by_court[c].append(j)

    print(f"  ✓ Federal: {len(output_judges):,} judges across {len(by_court)} courts")

    return {
        "judges": output_judges,
        "total_judges": len(output_judges),
        "total_courts": len(by_court),
        "source": data.get("source", "CourtListener Federal Judges"),
        "fetched": data.get("fetched", ""),
    }
