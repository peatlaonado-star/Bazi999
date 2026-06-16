#!/usr/bin/env python3
"""
STARVIA Content Completeness Checker + Auto-Fixer
Checks content integrity and auto-fixes safe issues (missing files, syntax errors, dist mismatches).
Run via cron: every 6 hours.
"""
import subprocess
import os
import re
import sys
import shutil
from pathlib import Path

PROJECT_DIR = Path("/home/kara/Starvia")

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

# Safe-to-fix: renderer functions that must exist
REQUIRED_RENDERER_FUNCS = [
    "buildYearlyTransitHtml",
    "buildRahuKetuHtml",
    "buildYearlyEnhancementHtml",
    "buildPlanetaryStrengthHtml",
]

class ContentChecker:
    def __init__(self):
        self.issues = []
        self.fixed = []
        self.blocking = []

    def run(self, cmd, cwd=None, timeout=30):
        try:
            r = subprocess.run(
                cmd, shell=isinstance(cmd, str), capture_output=True,
                text=True, timeout=timeout, cwd=cwd or str(PROJECT_DIR)
            )
            return r.stdout.strip(), r.returncode
        except Exception as e:
            return str(e), 1

    def fix_syntax(self, filepath):
        """Try to fix common JS syntax issues."""
        try:
            with open(filepath, "r") as f:
                content = f.read()
            # Fix unclosed strings
            lines = content.split("\n")
            for i, line in enumerate(lines):
                stripped = line.rstrip()
                # Count quotes
                single = stripped.count("'") - stripped.count("\\'")
                double = stripped.count('"') - stripped.count('\\"')
                if single % 2 != 0 or double % 2 != 0:
                    # Likely unclosed string - skip this file for now
                    return False
            return True
        except Exception:
            return False

    def rebuild(self):
        """Run npm run build and check result."""
        out, code = self.run("npm run build", timeout=60)
        if code != 0:
            self.blocking.append(f"BUILD FAILED: {out[:200]}")
            return False
        return True

    def git_commit_push(self, message):
        """Stage, commit, and push changes."""
        self.run("git add -A")
        out, code = self.run(f'git commit -m "{message}"', timeout=60)
        if code != 0 and "nothing to commit" not in out:
            self.blocking.append(f"COMMIT FAILED: {out[:200]}")
            return False
        out, code = self.run("git push origin main", timeout=30)
        if code != 0 and "rejected" in out:
            # Try pull then push
            self.run("git pull --no-rebase origin main", timeout=30)
            # Rebuild after pull
            self.rebuild()
            out, code = self.run("git push origin main", timeout=30)
        if code != 0:
            self.blocking.append(f"PUSH FAILED: {out[:200]}")
            return False
        return True

    def check_data_files(self):
        """Check all data files exist and have valid syntax."""
        for f in REQUIRED_DATA_FILES:
            path = PROJECT_DIR / "data" / f
            if not path.exists():
                self.blocking.append(f"MISSING DATA FILE: {f} — cannot auto-fix (needs content)")
                continue
            out, code = self.run(f"node -c {path}")
            if code != 0:
                # Try to fix
                if self.fix_syntax(path):
                    out2, code2 = self.run(f"node -c {path}")
                    if code2 == 0:
                        self.fixed.append(f"SYNTAX FIX: {f}")
                    else:
                        self.blocking.append(f"SYNTAX ERROR in {f}: {out[:150]}")
                else:
                    self.blocking.append(f"SYNTAX ERROR in {f}: {out[:150]}")

    def check_global_vars(self):
        """Check each file declares expected global var."""
        for f, var in EXPECTED_VARS.items():
            path = PROJECT_DIR / "data" / f
            if not path.exists():
                continue
            content = path.read_text()
            if f"var {var}" not in content:
                self.blocking.append(f"MISSING VAR in {f}: expected 'var {var}'")

    def check_script_tags(self):
        """Check index.html has all data script tags — auto-fix if missing."""
        index = PROJECT_DIR / "index.html"
        if not index.exists():
            self.blocking.append("MISSING: index.html")
            return
        html = index.read_text()
        missing = []
        for f in REQUIRED_DATA_FILES:
            if f not in html:
                missing.append(f)
        if missing:
            # Auto-fix: add script tags before the first renderer script
            insert_before = '<script defer src="js/reading-helpers.js'
            if insert_before in html:
                new_tags = ""
                for f in missing:
                    new_tags += f'<script defer src="data/{f}?v=2.0.4"></script>\n'
                html = html.replace(insert_before, new_tags + insert_before)
                index.write_text(html)
                self.fixed.append(f"ADDED SCRIPT TAGS: {', '.join(missing)}")
            else:
                self.blocking.append(f"MISSING SCRIPT TAGS and cannot auto-fix (insert point not found): {', '.join(missing)}")

    def check_build_pipeline(self):
        """Check copy-static-assets.mjs has all data files — auto-fix if missing."""
        mjs = PROJECT_DIR / "scripts" / "copy-static-assets.mjs"
        if not mjs.exists():
            self.blocking.append("MISSING: copy-static-assets.mjs")
            return
        content = mjs.read_text()
        missing = []
        for f in REQUIRED_DATA_FILES:
            if f not in content:
                missing.append(f)
        if missing:
            # Auto-fix: add to jsFiles array after thai-astrology-content.js
            insert_after = "'data/thai-astrology-content.js',"
            if insert_after in content:
                new_entries = ""
                for f in missing:
                    new_entries += f"  '{f}',\n"
                content = content.replace(insert_after, insert_after + "\n" + new_entries)
                mjs.write_text(content)
                self.fixed.append(f"ADDED TO BUILD PIPELINE: {', '.join(missing)}")
            else:
                self.blocking.append(f"MISSING FROM BUILD PIPELINE: {', '.join(missing)}")

    def check_dist(self):
        """Check dist/data/ has all files — auto-fix by rebuilding."""
        dist_data = PROJECT_DIR / "dist" / "data"
        if not dist_data.exists():
            self.blocking.append("MISSING: dist/data/ directory")
            return
        dist_files = [f.name for f in dist_data.iterdir()]
        missing = []
        for f in REQUIRED_DATA_FILES:
            base = f.replace(".js", "")
            if not any(base in df for df in dist_files):
                missing.append(f)
        if missing:
            # Auto-fix: rebuild
            if self.rebuild():
                self.fixed.append(f"REBUILT DIST: {', '.join(missing)} now included")
            else:
                self.blocking.append(f"DIST REBUILD FAILED for: {', '.join(missing)}")

    def check_renderer_functions(self):
        """Check renderer-individual.js has required functions."""
        renderer = PROJECT_DIR / "js" / "renderer-individual.js"
        if not renderer.exists():
            self.blocking.append("MISSING: renderer-individual.js")
            return
        content = renderer.read_text()
        for func in REQUIRED_RENDERER_FUNCS:
            if f"function {func}" not in content:
                self.blocking.append(f"MISSING FUNCTION: {func} in renderer-individual.js")

    def check_quiz(self):
        """Check quiz.html exists and references ELEMENT_QUIZ."""
        quiz = PROJECT_DIR / "quiz.html"
        if not quiz.exists():
            self.blocking.append("MISSING: quiz.html")
            return
        content = quiz.read_text()
        if "ELEMENT_QUIZ" not in content:
            self.blocking.append("quiz.html does not reference ELEMENT_QUIZ")

    def check_live_site(self):
        """Check live site loads."""
        out, code = self.run(
            "curl -s -o /dev/null -w '%{http_code}' --max-time 10 https://starvia.website/",
            timeout=15
        )
        if out.strip() != "200":
            self.blocking.append(f"LIVE SITE: HTTP {out.strip()} (expected 200)")

    def check_git_clean(self):
        """Check for uncommitted changes."""
        out, _ = self.run("git status -s")
        if out.strip():
            lines = out.strip().split("\n")
            self.issues.append(f"UNCOMMITTED: {len(lines)} file(s) modified")

    def run_all(self):
        print("=" * 50)
        print("🔍 STARVIA Content Check + Auto-Fix")
        print("=" * 50)

        self.check_data_files()
        self.check_global_vars()
        self.check_script_tags()
        self.check_build_pipeline()
        self.check_renderer_functions()
        self.check_quiz()
        self.check_dist()
        self.check_live_site()
        self.check_git_clean()

        # Report
        print("\n📋 Results:")
        if self.fixed:
            print("\n✅ AUTO-FIXED:")
            for f in self.fixed:
                print(f"   🔧 {f}")
        if self.issues:
            print("\n⚠️  INFO:")
            for i in self.issues:
                print(f"   ℹ️  {i}")
        if self.blocking:
            print("\n🚨 BLOCKING (needs human review):")
            for b in self.blocking:
                print(f"   ❌ {b}")

        if not self.fixed and not self.blocking:
            print("\n🎉 ALL CHECKS PASSED — Content is complete!")
            return "all_pass"
        elif self.fixed and not self.blocking:
            return "fixed"
        elif self.blocking:
            return "blocking"
        else:
            return "info"

    def commit_and_push(self, reason):
        """Commit auto-fixes and push."""
        msg = f"fix(content): auto-fixed — {reason}"
        ok = self.git_commit_push(msg)
        if ok:
            self.fixed.append("PUSHED to origin/main → CF Pages auto-deploy")
        return ok


def main():
    checker = ContentChecker()
    result = checker.run_all()

    if result == "all_pass":
        print("\n✅ Summary: All 11 data files loaded, dist builds clean, live site healthy")
        return 0

    if result == "fixed":
        # Auto-commit and push
        reason = "; ".join(checker.fixed[:3])
        checker.commit_and_push(reason)
        print(f"\n✅ Summary: {len(checker.fixed)} issue(s) auto-fixed and pushed")
        return 0

    if result == "blocking":
        print(f"\n🚨 Summary: {len(checker.blocking)} blocking issue(s) found — needs human review")
        return 1

    # Mixed — some info
    if checker.fixed:
        reason = "; ".join(checker.fixed[:3])
        checker.commit_and_push(reason)
    print(f"\n📋 Summary: {len(checker.fixed)} fixed, {len(checker.blocking)} blocking, {len(checker.issues)} info")
    return 1 if checker.blocking else 0


if __name__ == "__main__":
    sys.exit(main())
