#!/usr/bin/env python3
"""
New York ingest module.
Processes NY pretrial/recidivism/crime data → county-level stats.
"""

import json
from pathlib import Path


def run(config: dict, project_root: Path) -> dict:
    """
    Process NY data files → NY stats summary.
    Returns structured NY data.
    """
    sources = config["sources"]["new_york"]

    def load(key: str) -> dict | None:
        path = project_root / sources[key]
        if not path.exists():
            print(f"    ⚠️  Missing NY file: {path}")
            return None
        with open(path) as f:
            return json.load(f)

    ny_summary = load("ny_summary")
    pretrial = load("pretrial")
    arrests = load("arrests")
    crime_index = load("crime_index")
    jail_population = load("jail_population")

    if not ny_summary:
        print("  ⚠️  NY: Missing ny-summary.json, skipping")
        return {"counties": {}, "stats": {}}

    print(f"  ✓ NY: Loaded {len([x for x in [ny_summary, pretrial, arrests, crime_index, jail_population] if x])} NY data files")

    return {
        "ny_summary": ny_summary,
        "pretrial": pretrial,
        "arrests": arrests,
        "crime_index": crime_index,
        "jail_population": jail_population,
        "source": "NY Division of Criminal Justice Services (DCJS)",
    }
