#!/usr/bin/env python3
"""
STARVIA Content Completeness Checker
Checks if all 11 new content data files are loading and rendering correctly.
Run via cron: every 6 hours.
"""
import subprocess
import json
import re
import sys

PROJECT_DIR = "/home/kara/Starvia"

# All data files that should exist
REQUIRED_DATA_FILES = [
    "zodiac-identities.js",
    "element-practices.js",
    "life-periods.js",
    "yearly-transit.js",
    "couple-compatibility.js",
    "rahu-ketu.js",
    "yearly-enhancement.js",
    "auspicious-timing.js",
    "planetary-strength.js",
    "element-quiz.js",
    "life-graph-data.js",
]

# Expected global var names
EXPECTED_VARS = {
    "zodiac-identities.js": "ZODIAC_IDENTITIES",
    "element-practices.js": "ELEMENT_PRACTICES",
    "life-periods.js": "LIFE_PERIODS",
    "yearly-transit.js": "YEARLY_TRANSIT",
    "couple-compatibility.js": "COUPLE_COMPATIBILITY",
    "rahu-ketu.js": "RAHU_KETU",
    "yearly-enhancement.js": "YEARLY_ENHANCEMENT",
    "auspicious-timing.js": "AUSPICIOUS_TIMING",
    "planetary-strength.js": "PLANETARY_STRENGTH",
    "element-quiz.js": "ELEMENT_QUIZ",
    "life-graph-data.js": "LIFE_GRAPH_DATA",
}

def check_files():
    """Check if all data files exist locally."""
    issues = []
    for f in REQUIRED_DATA_FILES:
        path = f"{PROJECT_DIR}/data/{f}"
        try:
            result = subprocess.run(["node", "-c", path], capture_output=True, text=True, timeout=5)
            if result.returncode != 0:
                issues.append(f"SYNTAX ERROR: {f}: {result.stderr.strip()}")
        except FileNotFoundError:
            issues.append(f"MISSING: {f}")
    return issues

def check_global_vars():
    """Check if each data file declares the expected global var."""
    issues = []
    for f, var in EXPECTED_VARS.items():
        path = f"{PROJECT_DIR}/data/{f}"
        try:
            with open(path, "r") as fh:
                content = fh.read()
            if f"var {var}" not in content:
                issues.append(f"MISSING VAR: {f} does not declare 'var {var}'")
        except FileNotFoundError:
            pass
    return issues

def check_script_tags():
    """Check if index.html has script tags for all data files."""
    issues = []
    try:
        with open(f"{PROJECT_DIR}/index.html", "r") as fh:
            html = fh.read()
        for f in REQUIRED_DATA_FILES:
            if f not in html:
                issues.append(f"MISSING SCRIPT TAG: {f} not in index.html")
    except FileNotFoundError:
        issues.append("MISSING: index.html")
    return issues

def check_build_pipeline():
    """Check if copy-static-assets.mjs includes all data files."""
    issues = []
    try:
        with open(f"{PROJECT_DIR}/scripts/copy-static-assets.mjs", "r") as fh:
            content = fh.read()
        for f in REQUIRED_DATA_FILES:
            if f not in content:
                issues.append(f"MISSING FROM BUILD: {f} not in copy-static-assets.mjs")
    except FileNotFoundError:
        issues.append("MISSING: copy-static-assets.mjs")
    return issues

def check_dist():
    """Check if dist/data/ has all hashed data files."""
    issues = []
    try:
        result = subprocess.run(
            ["ls", f"{PROJECT_DIR}/dist/data/"],
            capture_output=True, text=True, timeout=5
        )
        dist_files = result.stdout.strip().split("\n")
        for f in REQUIRED_DATA_FILES:
            base = f.replace(".js", "")
            if not any(base in df for df in dist_files):
                issues.append(f"NOT IN DIST: {f} not found in dist/data/")
    except Exception as e:
        issues.append(f"ERROR checking dist: {e}")
    return issues

def check_renderer_functions():
    """Check if renderer-individual.js has the new render functions."""
    issues = []
    required_funcs = [
        "buildYearlyTransitHtml",
        "buildRahuKetuHtml",
        "buildYearlyEnhancementHtml",
        "buildPlanetaryStrengthHtml",
    ]
    try:
        with open(f"{PROJECT_DIR}/js/renderer-individual.js", "r") as fh:
            content = fh.read()
        for func in required_funcs:
            if f"function {func}" not in content:
                issues.append(f"MISSING FUNCTION: {func} not in renderer-individual.js")
    except FileNotFoundError:
        issues.append("MISSING: renderer-individual.js")
    return issues

def check_quiz():
    """Check if quiz.html exists."""
    issues = []
    try:
        with open(f"{PROJECT_DIR}/quiz.html", "r") as fh:
            content = fh.read()
        if "ELEMENT_QUIZ" not in content:
            issues.append("quiz.html does not reference ELEMENT_QUIZ")
    except FileNotFoundError:
        issues.append("MISSING: quiz.html")
    return issues

def check_live_site():
    """Check if the live site loads and data files are accessible."""
    issues = []
    try:
        result = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
             "--max-time", "10", "https://starvia.website/"],
            capture_output=True, text=True, timeout=15
        )
        if result.stdout.strip() != "200":
            issues.append(f"LIVE SITE: HTTP {result.stdout.strip()} (expected 200)")
    except Exception as e:
        issues.append(f"LIVE SITE CHECK FAILED: {e}")
    
    # Check a couple of data files are accessible via CDN
    for f in ["zodiac-identities.js", "element-quiz.js"]:
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                 "--max-time", "10", f"https://starvia.website/data/{f}"],
                capture_output=True, text=True, timeout=15
            )
            if result.stdout.strip() != "200":
                issues.append(f"DATA FILE 404: {f} not accessible at /data/{f}")
        except Exception:
            pass
    
    return issues

def check_git_status():
    """Check git status for uncommitted changes."""
    issues = []
    try:
        result = subprocess.run(
            ["git", "status", "-s"],
            capture_output=True, text=True, timeout=10,
            cwd=PROJECT_DIR
        )
        dirty = result.stdout.strip()
        if dirty:
            lines = dirty.strip().split("\n")
            issues.append(f"UNCOMMITTED CHANGES: {len(lines)} files modified")
    except Exception as e:
        issues.append(f"GIT CHECK FAILED: {e}")
    return issues

def main():
    all_issues = []
    
    print("=" * 50)
    print("STARVIA Content Completeness Check")
    print("=" * 50)
    
    # Run all checks
    checks = [
        ("📁 Data Files", check_files),
        ("🔤 Global Vars", check_global_vars),
        ("📝 Script Tags", check_script_tags),
        ("🏗️ Build Pipeline", check_build_pipeline),
        ("📦 Dist Files", check_dist),
        ("⚙️ Renderer Functions", check_renderer_functions),
        ("🧪 Quiz Page", check_quiz),
        ("🌐 Live Site", check_live_site),
        ("📋 Git Status", check_git_status),
    ]
    
    for name, check_fn in checks:
        issues = check_fn()
        status = "✅" if not issues else "❌"
        print(f"\n{status} {name}")
        for issue in issues:
            print(f"   - {issue}")
            all_issues.append(f"[{name}] {issue}")
    
    print("\n" + "=" * 50)
    if not all_issues:
        print("🎉 ALL CHECKS PASSED — Content is complete!")
        return 0
    else:
        print(f"⚠️  FOUND {len(all_issues)} ISSUE(S):")
        for i, issue in enumerate(all_issues, 1):
            print(f"   {i}. {issue}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
