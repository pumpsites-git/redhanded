#!/usr/bin/env python3
"""
RedHanded Data Pipeline — Main Entry Point
==========================================
Usage: python pipeline/pipeline.py [--skip-fdle] [--skip-il] [--skip-federal]

Reads pipeline/config.yaml, runs each ingest module, validates outputs,
writes to data/master/, prints summary report.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import yaml

# ── Setup paths ───────────────────────────────────────────────────────────────
HERE = Path(__file__).parent
PROJECT_ROOT = HERE.parent
sys.path.insert(0, str(HERE))

from ingest import cook_county, fdle_counties, florida_judges, federal_judges, new_york
from validate import validators


def load_config() -> dict:
    config_path = HERE / "config.yaml"
    with open(config_path) as f:
        return yaml.safe_load(f)


def check_incoming(config: dict, project_root: Path) -> list[dict]:
    """
    Check data/incoming/ for new submissions.
    Returns list of found files with metadata.
    """
    incoming_dir = project_root / "data" / "incoming"
    if not incoming_dir.exists():
        return []

    found = []
    for item in sorted(incoming_dir.iterdir()):
        if item.is_file() and item.suffix in ('.json', '.csv') and not item.name.startswith('_') and item.name != 'README.md':
            found.append({
                "file": str(item),
                "name": item.name,
                "size": item.stat().st_size,
                "type": "csv" if item.suffix == '.csv' else "json",
            })

    if found:
        print(f"\n📬 Found {len(found)} file(s) in incoming/:")
        for f in found:
            print(f"   • {f['name']} ({f['size']:,} bytes) — manual ingest required")
        print("   ℹ️  Incoming files require manual review before pipeline ingest.")

    return found


def write_master_file(path: Path, data: dict) -> None:
    """Atomically write a JSON master file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix('.tmp.json')
    with open(tmp, 'w') as f:
        json.dump(data, f, indent=2)
    tmp.rename(path)


def build_state_judges(il_result: dict, fl_result: dict, today: str) -> dict:
    """Merge IL and FL judges into unified state-judges.json."""
    all_judges: dict[str, dict] = {}

    # IL judge profiles
    if il_result and "profiles" in il_result:
        il_profiles = il_result["profiles"]
        for slug, judge in il_profiles.get("judges", {}).items():
            all_judges[slug] = judge

    # FL judge profiles from BenchmarkWeb
    if fl_result and "judges" in fl_result:
        for slug, judge in fl_result["judges"].items():
            # Avoid slug collision with IL judges
            if slug in all_judges:
                slug = f"fl-{slug}"
            all_judges[slug] = judge

    total_cases = sum(j.get("totalCases", 0) for j in all_judges.values())

    sources = []
    if il_result:
        sources.append("Cook County IL Sentencing")
    if fl_result:
        sources.append("FL BenchmarkWeb (Bay, Indian River, St. Johns, Charlotte Counties)")

    return {
        "meta": {
            "generated": today,
            "sources": sources,
            "totalJudges": len(all_judges),
            "totalCases": total_cases,
            "pipelineVersion": "1.0",
        },
        # Keep legacy fields for backwards compatibility
        "generated": today,
        "source": "; ".join(sources) if sources else "Unknown",
        "totalJudges": len(all_judges),
        "totalCases": total_cases,
        "courtAverage": il_result["profiles"].get("courtAverage", {}) if il_result else {},
        "summary": il_result["profiles"].get("summary", {}) if il_result else {},
        "judges": all_judges,
    }


def build_county_profiles(fdle_result: dict, today: str) -> dict:
    """Build county-profiles.json from FDLE data."""
    if not fdle_result or not fdle_result.get("counties"):
        return {
            "meta": {"generated": today, "sources": [], "totalCounties": 0, "totalCases": 0},
            "counties": {},
        }

    counties = fdle_result["counties"]
    total_cases = fdle_result.get("sentenced_count", 0)

    return {
        "meta": {
            "generated": today,
            "sources": ["FDLE Criminal Justice Data Transparency, Clerk of Court Reports"],
            "totalCounties": len(counties),
            "totalCases": total_cases,
            "pipelineVersion": "1.0",
        },
        # Legacy fields
        "generated": today,
        "source": fdle_result.get("source", "FDLE"),
        "totalCounties": len(counties),
        "totalCases": total_cases,
        "stateAverage": fdle_result.get("stateAverage", {}),
        "counties": counties,
    }


def build_federal_judges(fed_result: dict, today: str) -> dict:
    """Build federal-judges.json."""
    if not fed_result:
        return {"judges": [], "totalJudges": 0, "generated": today}

    return {
        "generated": today,
        "fetched": fed_result.get("fetched", ""),
        "source": fed_result.get("source", "CourtListener"),
        "totalJudges": fed_result.get("total_judges", 0),
        "totalCourts": fed_result.get("total_courts", 0),
        "pipelineVersion": "1.0",
        "judges": fed_result.get("judges", []),
    }


def build_manifest(
    today_iso: str,
    sources_info: list[dict],
    validation_summary: dict,
) -> dict:
    return {
        "built": today_iso,
        "pipelineVersion": "1.0",
        "sources": sources_info,
        "validation": {
            "passed": validation_summary.get("passed", False),
            "checks": validation_summary.get("totalChecks", 0),
            "warnings": validation_summary.get("totalWarnings", 0),
            "errors": validation_summary.get("totalErrors", 0),
        },
    }


def print_summary_table(
    il_result: dict | None,
    fl_judge_result: dict | None,
    fdle_result: dict | None,
    fed_result: dict | None,
    ny_result: dict | None,
    validation_summary: dict,
    elapsed: float,
) -> None:
    width = 72
    print()
    print("=" * width)
    print("  RedHanded Pipeline — Build Summary")
    print("=" * width)
    print(f"  {'Source':<32} {'Records':>12}  {'Output':>16}")
    print("-" * width)

    if il_result:
        raw = il_result.get("raw_count", 0)
        judges = il_result.get("judge_count", 0)
        print(f"  {'Cook County IL Sentencing':<32} {raw:>12,}  {judges:>13} judges")
    else:
        print(f"  {'Cook County IL Sentencing':<32} {'SKIPPED':>12}  {'—':>16}")

    if fl_judge_result:
        total = fl_judge_result.get("total_cases", 0)
        judges = fl_judge_result.get("total_judges", 0)
        print(f"  {'FL BenchmarkWeb (4 counties)':<32} {total:>12,}  {judges:>13} judges")
    else:
        print(f"  {'FL BenchmarkWeb':<32} {'SKIPPED':>12}  {'—':>16}")

    if fdle_result:
        raw = fdle_result.get("raw_count", 0)
        sentenced = fdle_result.get("sentenced_count", 0)
        counties = fdle_result.get("county_count", 0)
        print(f"  {'FDLE Clerk Cases (FL)':<32} {raw:>12,}  {counties:>13} counties")
        print(f"  {'  → sentenced':<32} {sentenced:>12,}  {'':>16}")
    else:
        print(f"  {'FDLE Clerk Cases (FL)':<32} {'SKIPPED':>12}  {'—':>16}")

    if fed_result:
        judges = fed_result.get("total_judges", 0)
        courts = fed_result.get("total_courts", 0)
        print(f"  {'CourtListener Federal Judges':<32} {judges:>12,}  {courts:>12} courts")
    else:
        print(f"  {'CourtListener Federal Judges':<32} {'SKIPPED':>12}  {'—':>16}")

    if ny_result:
        print(f"  {'NY State Stats':<32} {'loaded':>12}  {'summary only':>16}")
    else:
        print(f"  {'NY State Stats':<32} {'SKIPPED':>12}  {'—':>16}")

    print("-" * width)

    v = validation_summary
    passed = v.get("passed", False)
    checks = v.get("totalChecks", 0)
    errors = v.get("totalErrors", 0)
    warnings = v.get("totalWarnings", 0)
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"  Validation: {status}  ({checks} checks, {errors} errors, {warnings} warnings)")

    if not passed and v.get("results"):
        for area, res in v["results"].items():
            if isinstance(res, dict) and not res.get("passed", True):
                print(f"    ✗ {area}: {res.get('errorDetails', ['unknown'])}")

    print(f"  Time: {elapsed:.1f}s")
    print("=" * width)
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="RedHanded Data Pipeline")
    parser.add_argument("--skip-fdle", action="store_true", help="Skip FDLE CSV processing (slow)")
    parser.add_argument("--skip-il", action="store_true", help="Skip IL Cook County processing")
    parser.add_argument("--skip-federal", action="store_true", help="Skip federal judges processing")
    parser.add_argument("--skip-fl-judges", action="store_true", help="Skip FL BenchmarkWeb judges")
    args = parser.parse_args()

    start_time = time.time()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    print(f"\n🚀 RedHanded Pipeline v1.0 — {today_iso}")
    print(f"   Project root: {PROJECT_ROOT}")

    config = load_config()
    master_dir = PROJECT_ROOT / config["output"]["master_dir"]
    master_dir.mkdir(parents=True, exist_ok=True)

    # Check incoming
    check_incoming(config, PROJECT_ROOT)

    # ── Ingest ────────────────────────────────────────────────────────────────
    ingest_results: dict[str, dict | None] = {}

    print("\n📥 Ingest Phase")
    print("-" * 40)

    # Cook County IL
    if not args.skip_il:
        print("\n[1/5] Cook County IL Sentencing...")
        try:
            il_result = cook_county.run(config, PROJECT_ROOT)
            ingest_results["cook_county"] = il_result
        except Exception as e:
            print(f"  ✗ Cook County failed: {e}")
            import traceback; traceback.print_exc()
            ingest_results["cook_county"] = None
    else:
        print("\n[1/5] Cook County IL — SKIPPED")
        ingest_results["cook_county"] = None

    # FDLE counties
    if not args.skip_fdle:
        print("\n[2/5] FDLE Florida Counties...")
        try:
            fdle_result = fdle_counties.run(config, PROJECT_ROOT)
            ingest_results["fdle"] = fdle_result
        except Exception as e:
            print(f"  ✗ FDLE failed: {e}")
            import traceback; traceback.print_exc()
            ingest_results["fdle"] = None
    else:
        print("\n[2/5] FDLE Counties — SKIPPED")
        ingest_results["fdle"] = None

    # FL BenchmarkWeb judges
    if not args.skip_fl_judges:
        print("\n[3/5] FL BenchmarkWeb Judges...")
        try:
            fl_result = florida_judges.run(config, PROJECT_ROOT)
            ingest_results["florida_judges"] = fl_result
        except Exception as e:
            print(f"  ✗ FL judges failed: {e}")
            import traceback; traceback.print_exc()
            ingest_results["florida_judges"] = None
    else:
        print("\n[3/5] FL BenchmarkWeb Judges — SKIPPED")
        ingest_results["florida_judges"] = None

    # Federal judges
    if not args.skip_federal:
        print("\n[4/5] Federal Judges (CourtListener)...")
        try:
            fed_result = federal_judges.run(config, PROJECT_ROOT)
            ingest_results["federal"] = fed_result
        except Exception as e:
            print(f"  ✗ Federal judges failed: {e}")
            import traceback; traceback.print_exc()
            ingest_results["federal"] = None
    else:
        print("\n[4/5] Federal Judges — SKIPPED")
        ingest_results["federal"] = None

    # New York
    print("\n[5/5] New York Stats...")
    try:
        ny_result = new_york.run(config, PROJECT_ROOT)
        ingest_results["new_york"] = ny_result
    except Exception as e:
        print(f"  ✗ NY failed: {e}")
        ingest_results["new_york"] = None

    # ── Build master files ────────────────────────────────────────────────────
    print("\n📦 Building Master Files")
    print("-" * 40)

    il_result = ingest_results.get("cook_county")
    fl_judge_result = ingest_results.get("florida_judges")
    fdle_result = ingest_results.get("fdle")
    fed_result = ingest_results.get("federal")
    ny_result = ingest_results.get("new_york")

    # state-judges.json
    state_judges = build_state_judges(il_result, fl_judge_result, today)
    sj_path = PROJECT_ROOT / config["output"]["files"]["state_judges"]
    write_master_file(sj_path, state_judges)
    print(f"  ✓ {sj_path.relative_to(PROJECT_ROOT)} — {state_judges['totalJudges']} judges")

    # county-profiles.json
    county_profiles = build_county_profiles(fdle_result, today)
    cp_path = PROJECT_ROOT / config["output"]["files"]["county_profiles"]
    write_master_file(cp_path, county_profiles)
    print(f"  ✓ {cp_path.relative_to(PROJECT_ROOT)} — {county_profiles['totalCounties']} counties")

    # federal-judges.json
    federal_data = build_federal_judges(fed_result, today)
    fj_path = PROJECT_ROOT / config["output"]["files"]["federal_judges"]
    write_master_file(fj_path, federal_data)
    print(f"  ✓ {fj_path.relative_to(PROJECT_ROOT)} — {federal_data['totalJudges']} judges")

    # ny-stats.json
    if ny_result:
        ny_path = PROJECT_ROOT / config["output"]["files"]["ny_stats"]
        write_master_file(ny_path, {
            "generated": today,
            "source": "NY Division of Criminal Justice Services (DCJS)",
            **{k: v for k, v in ny_result.items() if k != "source"},
        })
        print(f"  ✓ {ny_path.relative_to(PROJECT_ROOT)}")

    # ── Validation ────────────────────────────────────────────────────────────
    print("\n✅ Validation Phase")
    print("-" * 40)
    validation_result = validators.run_all(master_dir, ingest_results)

    # validation.json
    vpath = PROJECT_ROOT / config["output"]["files"]["validation"]
    write_master_file(vpath, {
        "generated": today_iso,
        **validation_result,
    })
    print(f"  ✓ {vpath.relative_to(PROJECT_ROOT)}")

    # ── Build manifest ────────────────────────────────────────────────────────
    sources_info = []
    if il_result:
        sources_info.append({
            "name": "Cook County Sentencing",
            "rawRecords": il_result.get("raw_count", 0),
            "profiledJudges": il_result.get("judge_count", 0),
            "file": "data/raw/illinois/cook-county-sentencing-full.json",
        })
    if fdle_result:
        sources_info.append({
            "name": "FDLE Clerk Cases",
            "rawRecords": fdle_result.get("raw_count", 0),
            "convictedRecords": fdle_result.get("sentenced_count", 0),
            "counties": fdle_result.get("county_count", 0),
            "files": [str(p) for p in [
                "data/raw/florida/fdle/CjdtClerkCase_00000.csv",
                "data/raw/florida/fdle/CjdtClerkCase_00001.csv",
                "data/raw/florida/fdle/CjdtClerkCase_00002.csv",
                "data/raw/florida/fdle/CjdtClerkCase_00003.csv",
                "data/raw/florida/fdle/CjdtClerkCase_00004.csv",
            ]],
        })
    if fl_judge_result:
        sources_info.append({
            "name": "FL BenchmarkWeb Cases",
            "rawRecords": fl_judge_result.get("total_cases", 0),
            "profiledJudges": fl_judge_result.get("total_judges", 0),
            "counties": ["Bay", "Indian River", "St. Johns", "Charlotte"],
        })
    if fed_result:
        sources_info.append({
            "name": "CourtListener Federal Judges",
            "rawRecords": fed_result.get("total_judges", 0),
            "courts": fed_result.get("total_courts", 0),
            "file": "data/raw/federal/courtlistener-judges.json",
        })
    if ny_result:
        sources_info.append({
            "name": "NY DCJS Stats",
            "files": ["data/raw/new-york/ny-summary.json"],
        })

    manifest = build_manifest(today_iso, sources_info, validation_result)
    mf_path = PROJECT_ROOT / config["output"]["files"]["manifest"]
    write_master_file(mf_path, manifest)
    print(f"  ✓ {mf_path.relative_to(PROJECT_ROOT)}")

    # ── Summary ───────────────────────────────────────────────────────────────
    elapsed = time.time() - start_time
    print_summary_table(
        il_result, fl_judge_result, fdle_result, fed_result, ny_result,
        validation_result, elapsed
    )

    sys.exit(0 if validation_result.get("passed", False) else 1)


if __name__ == "__main__":
    # Ensure yaml is available
    try:
        import yaml
    except ImportError:
        print("Installing PyYAML...")
        os.system(f"{sys.executable} -m pip install pyyaml -q")
        import yaml

    main()
