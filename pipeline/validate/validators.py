#!/usr/bin/env python3
"""
Validation module for RedHanded pipeline.
Runs sanity checks on all generated master output.
"""

from pathlib import Path
from typing import Any


class ValidationResult:
    def __init__(self):
        self.checks: list[dict] = []
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def check(self, name: str, passed: bool, message: str = "", severity: str = "error") -> None:
        self.checks.append({"name": name, "passed": passed, "message": message, "severity": severity})
        if not passed:
            if severity == "error":
                self.errors.append(f"{name}: {message}")
            else:
                self.warnings.append(f"{name}: {message}")

    @property
    def passed(self) -> bool:
        return len(self.errors) == 0

    def summary(self) -> dict:
        return {
            "passed": self.passed,
            "checks": len(self.checks),
            "checksPassed": sum(1 for c in self.checks if c["passed"]),
            "warnings": len(self.warnings),
            "errors": len(self.errors),
            "errorDetails": self.errors,
            "warningDetails": self.warnings,
            "allChecks": self.checks,
        }


def validate_state_judges(data: dict, raw_count: int) -> ValidationResult:
    """Validate state-judges.json"""
    v = ValidationResult()

    judges = data.get("judges", {})
    v.check("state_judges_exists", bool(judges), "No judges found")
    v.check("state_judges_minimum", len(judges) >= 50, f"Only {len(judges)} judges (expected 50+)")

    if not judges:
        return v

    # Slug uniqueness
    slugs = list(judges.keys())
    unique_slugs = set(slugs)
    v.check("no_duplicate_slugs", len(slugs) == len(unique_slugs),
            f"{len(slugs) - len(unique_slugs)} duplicate slugs", "error")

    # Rate sanity checks
    rate_violations = []
    leniency_violations = []
    for slug, j in judges.items():
        prison = j.get("prisonRate", 0)
        probation = j.get("probationRate", 0)
        jail = j.get("jailRate", 0)
        other = j.get("otherRate", 0)
        total_rate = prison + probation + jail + other

        if abs(total_rate - 1.0) > 0.05:
            rate_violations.append(f"{slug}: {total_rate:.3f}")

        leniency = j.get("leniencyScore", 0)
        if not (0 <= leniency <= 100):
            leniency_violations.append(f"{slug}: {leniency}")

    v.check("rates_sum_to_one", len(rate_violations) == 0,
            f"{len(rate_violations)} judges with rates not summing to ~1.0: {rate_violations[:3]}", "warning")
    v.check("leniency_in_range", len(leniency_violations) == 0,
            f"{len(leniency_violations)} judges with leniency out of 0-100: {leniency_violations[:3]}", "error")

    # Record count sanity (allow for grouping reduction)
    total_cases = data.get("totalCases", 0)
    v.check("state_judges_case_count", total_cases > 0, "totalCases is 0")
    if raw_count > 0:
        v.check("state_judges_case_count_match", abs(total_cases - raw_count) < raw_count * 0.01,
                f"totalCases {total_cases:,} vs raw {raw_count:,}", "warning")

    # Names present
    missing_names = [slug for slug, j in judges.items() if not j.get("name")]
    v.check("all_judges_have_names", len(missing_names) == 0,
            f"{len(missing_names)} judges missing names", "warning")

    # All judges have state info
    missing_state = [slug for slug, j in judges.items() if not j.get("stateCode")]
    v.check("all_judges_have_state", len(missing_state) == 0,
            f"{len(missing_state)} judges missing stateCode", "warning")

    return v


def validate_county_profiles(data: dict, raw_count: int) -> ValidationResult:
    """Validate county-profiles.json"""
    v = ValidationResult()

    counties = data.get("counties", {})
    v.check("counties_exists", bool(counties), "No counties found")
    v.check("florida_counties_count", len(counties) >= 60,
            f"Only {len(counties)} FL counties (expected 67)", "warning")

    if not counties:
        return v

    # Rate checks
    rate_violations = []
    for slug, c in counties.items():
        prison = c.get("prisonRate", 0)
        jail = c.get("jailRate", 0)
        prob = c.get("probationRate", 0)
        comm = c.get("commCtrlRate", 0)
        no_conf = c.get("noConfinementRate", 0)
        total_rate = prison + jail + prob + comm + no_conf
        if abs(total_rate - 1.0) > 0.10:
            rate_violations.append(f"{slug}: {total_rate:.3f}")

    v.check("county_rates_sum", len(rate_violations) == 0,
            f"{len(rate_violations)} counties with rates not summing to ~1.0: {rate_violations[:3]}", "warning")

    # Leniency scores in range
    leniency_violations = [s for s, c in counties.items()
                           if not (0 <= c.get("leniencyScore", 50) <= 100)]
    v.check("county_leniency_range", len(leniency_violations) == 0,
            f"{len(leniency_violations)} counties with leniency out of range", "error")

    # Total case count
    total_cases = data.get("meta", {}).get("totalCases", 0) or data.get("totalCases", 0)
    v.check("county_case_count", total_cases > 1_000_000,
            f"Only {total_cases:,} county cases (expected >1M for FL)", "warning")

    return v


def validate_federal_judges(data: dict) -> ValidationResult:
    """Validate federal-judges.json"""
    v = ValidationResult()

    judges = data.get("judges", [])
    v.check("federal_judges_exists", bool(judges), "No federal judges found")
    v.check("federal_judges_minimum", len(judges) >= 1000,
            f"Only {len(judges)} federal judges (expected 1000+)", "warning")

    if not judges:
        return v

    # All have names
    missing_names = [j.get("slug", "?") for j in judges if not j.get("name")]
    v.check("federal_judges_names", len(missing_names) == 0,
            f"{len(missing_names)} federal judges missing names", "warning")

    # Slugs unique
    slugs = [j.get("slug", "") for j in judges]
    unique = set(s for s in slugs if s)
    v.check("federal_judges_slug_unique", len(unique) >= len(slugs) * 0.95,
            f"Many duplicate/missing slugs ({len(slugs) - len(unique)})", "warning")

    return v


def validate_manifest(manifest: dict) -> ValidationResult:
    """Validate manifest.json"""
    v = ValidationResult()

    v.check("manifest_built", bool(manifest.get("built")), "manifest.built missing")
    v.check("manifest_version", bool(manifest.get("pipelineVersion")), "manifest.pipelineVersion missing")
    v.check("manifest_sources", len(manifest.get("sources", [])) >= 2,
            "manifest.sources has fewer than 2 entries", "warning")

    return v


def run_all(master_dir: Path, ingest_results: dict) -> dict:
    """
    Run all validation checks against the built master files.
    Returns full validation audit trail.
    """
    results: dict[str, Any] = {}
    total_errors = 0
    total_warnings = 0
    total_checks = 0

    print("  Running validation checks...")

    # State judges
    sj_path = master_dir / "state-judges.json"
    if sj_path.exists():
        with open(sj_path) as f:
            sj_data = json_load(f)
        raw_count = ingest_results.get("cook_county", {}).get("raw_count", 0)
        r = validate_state_judges(sj_data, raw_count)
        results["state_judges"] = r.summary()
        total_errors += len(r.errors)
        total_warnings += len(r.warnings)
        total_checks += len(r.checks)
        status = "✓" if r.passed else "✗"
        print(f"    {status} state-judges: {len(r.checks)} checks, {len(r.errors)} errors, {len(r.warnings)} warnings")
    else:
        results["state_judges"] = {"passed": False, "message": "File not found"}
        total_errors += 1

    # County profiles
    cp_path = master_dir / "county-profiles.json"
    if cp_path.exists():
        with open(cp_path) as f:
            cp_data = json_load(f)
        raw_count = ingest_results.get("fdle", {}).get("sentenced_count", 0)
        r = validate_county_profiles(cp_data, raw_count)
        results["county_profiles"] = r.summary()
        total_errors += len(r.errors)
        total_warnings += len(r.warnings)
        total_checks += len(r.checks)
        status = "✓" if r.passed else "✗"
        print(f"    {status} county-profiles: {len(r.checks)} checks, {len(r.errors)} errors, {len(r.warnings)} warnings")
    else:
        results["county_profiles"] = {"passed": False, "message": "File not found"}
        total_errors += 1

    # Federal judges
    fj_path = master_dir / "federal-judges.json"
    if fj_path.exists():
        with open(fj_path) as f:
            fj_data = json_load(f)
        r = validate_federal_judges(fj_data)
        results["federal_judges"] = r.summary()
        total_errors += len(r.errors)
        total_warnings += len(r.warnings)
        total_checks += len(r.checks)
        status = "✓" if r.passed else "✗"
        print(f"    {status} federal-judges: {len(r.checks)} checks, {len(r.errors)} errors, {len(r.warnings)} warnings")
    else:
        results["federal_judges"] = {"passed": False, "message": "File not found"}
        total_errors += 1

    # Manifest
    mf_path = master_dir / "manifest.json"
    if mf_path.exists():
        with open(mf_path) as f:
            mf_data = json_load(f)
        r = validate_manifest(mf_data)
        results["manifest"] = r.summary()
        total_errors += len(r.errors)
        total_warnings += len(r.warnings)
        total_checks += len(r.checks)
        status = "✓" if r.passed else "✗"
        print(f"    {status} manifest: {len(r.checks)} checks, {len(r.errors)} errors, {len(r.warnings)} warnings")
    else:
        results["manifest"] = {"passed": False, "message": "File not found"}
        total_errors += 1

    overall_passed = total_errors == 0
    print(f"  {'✓ All checks passed' if overall_passed else '✗ Validation failed'}: {total_checks} checks, {total_errors} errors, {total_warnings} warnings")

    return {
        "passed": overall_passed,
        "totalChecks": total_checks,
        "totalErrors": total_errors,
        "totalWarnings": total_warnings,
        "results": results,
    }


def json_load(f) -> dict:
    import json
    return json.load(f)
