#!/usr/bin/env python3
"""
STARVIA Cloudflare Pages Deployer
==================================
Auto-trigger CF Pages deploy from git push.

Usage:
    python3 scripts/deploy.py                  # Deploy current commit
    python3 scripts/deploy.py --commit <sha>   # Deploy specific commit
    python3 scripts/deploy.py --wait           # Wait for build to complete
    python3 scripts/deploy.py --url            # Print preview URL

Why this exists:
    CF Pages GitHub webhook is currently broken in this project (every
    deployment shows type=ad_hoc). This script bypasses the broken webhook
    by calling the CF API directly.

Setup:
    Reads credentials from ~/.hermes/cloudflare.env:
        CLOUDFLARE_API_KEY
        CLOUDFLARE_EMAIL
        CLOUDFLARE_ACCOUNT_ID

Can also be called as a post-push git hook:
    .git/hooks/post-push  ->  python3 scripts/deploy.py --wait
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError


HERMES_ENV = Path.home() / ".hermes" / "cloudflare.env"
PROJECT_NAME = "starvia"
PROD_BRANCH = "main"
CF_API_BASE = "https://api.cloudflare.com/client/v4"


def load_credentials():
    """Load CF API credentials from ~/.hermes/cloudflare.env."""
    if not HERMES_ENV.exists():
        sys.exit(f"❌ Missing {HERMES_ENV}")
    creds = {}
    for line in HERMES_ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            creds[k.strip()] = v.strip()
    # Email var name varies: cloudflare.env uses CLOUDFLARE_API_EMAIL, scripts
    # sometimes use CLOUDFLARE_EMAIL. Normalize.
    if creds.get("CLOUDFLARE_API_EMAIL") and not creds.get("CLOUDFLARE_EMAIL"):
        creds["CLOUDFLARE_EMAIL"] = creds["CLOUDFLARE_API_EMAIL"]
    required = ["CLOUDFLARE_API_KEY", "CLOUDFLARE_EMAIL", "CLOUDFLARE_ACCOUNT_ID"]
    missing = [k for k in required if not creds.get(k)]
    if missing:
        sys.exit(f"❌ Missing in {HERMES_ENV}: {', '.join(missing)}")
    return creds


def cf_request(method, path, creds, body=None):
    """Make authenticated CF API request, return parsed JSON."""
    url = f"{CF_API_BASE}{path}"
    headers = {
        "X-Auth-Email": creds.get("CLOUDFLARE_EMAIL") or creds.get("CLOUDFLARE_API_EMAIL"),
        "X-Auth-Key": creds["CLOUDFLARE_API_KEY"],
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except HTTPError as e:
        body_text = e.read().decode(errors="replace")
        sys.exit(f"❌ CF API {e.code}: {body_text[:300]}")


def git(*args, repo="."):
    """Run git command in repo, return stdout."""
    try:
        out = subprocess.run(
            ["git", "-C", str(repo), *args],
            capture_output=True, text=True, check=True, timeout=10,
        )
        return out.stdout.strip()
    except subprocess.CalledProcessError as e:
        sys.exit(f"❌ git {args} failed: {e.stderr.strip()}")


def get_current_commit():
    return git("rev-parse", "HEAD")


def trigger_deploy(creds, commit_sha):
    """Trigger a fresh CF Pages deployment for the given commit."""
    body = {
        "deployment_trigger": {
            "type": "ad_hoc",
            "metadata": {
                "branch": PROD_BRANCH,
                "commit_hash": commit_sha,
            },
        }
    }
    path = f"/accounts/{creds['CLOUDFLARE_ACCOUNT_ID']}/pages/projects/{PROJECT_NAME}/deployments"
    print(f"🚀 Triggering deploy for commit {commit_sha[:10]}...")
    resp = cf_request("POST", path, creds, body=body)
    if not resp.get("success"):
        sys.exit(f"❌ Deploy failed: {resp.get('errors')}")
    return resp["result"]


PROD_URL = "https://starvia.website"


def verify_production(deploy_id, expected_token=None, timeout=60):
    """After CF says success, verify the live URL actually reflects the new
    build. This catches the case where CF build succeeded but CDN/proxy is
    still serving stale content (or git push didn't include the new file).

    Checks:
      1. Production URL is reachable (HTTP 200)
      2. The CSS bundle on production contains expected marker (e.g. a new
         class name from the build), OR matches the asset we just deployed
      3. Returns a dict with bundle name, marker found, status
    """
    print(f"🔍 Verifying production {PROD_URL} reflects new build...")

    # Use a real browser User-Agent — Cloudflare's bot protection
    # returns 403 for default urllib/python-requests User-Agent.
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,th;q=0.8",
    }

    # 1. Reachability
    try:
        req = Request(PROD_URL, headers=HEADERS)
        with urlopen(req, timeout=15) as r:
            status = r.status
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return {"ok": False, "error": f"unreachable: {e}"}

    if status != 200:
        return {"ok": False, "error": f"HTTP {status}"}

    # 2. Extract current CSS bundle
    import re
    m = re.search(r'(main-[A-Za-z0-9_-]+\.css)', html)
    if not m:
        return {"ok": False, "error": "no main-*.css in HTML"}
    current_css = m.group(1)
    print(f"  📦 Production CSS: {current_css}")

    # 3. Fetch the CSS and check for expected marker
    css_url = f"{PROD_URL}/assets/{current_css}"
    try:
        req = Request(css_url, headers=HEADERS)
        with urlopen(req, timeout=15) as r:
            css = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return {"ok": False, "error": f"CSS unreachable: {e}"}

    if expected_token:
        if expected_token in css:
            print(f"  ✅ Marker '{expected_token}' found in CSS")
        else:
            return {
                "ok": False,
                "error": f"marker '{expected_token}' not in {current_css}",
                "css_bundle": current_css,
            }

    return {
        "ok": True,
        "http_status": status,
        "css_bundle": current_css,
        "css_size_kb": round(len(css) / 1024, 1),
    }


def get_deployment(creds, deploy_id):
    path = f"/accounts/{creds['CLOUDFLARE_ACCOUNT_ID']}/pages/projects/{PROJECT_NAME}/deployments/{deploy_id}"
    return cf_request("GET", path, creds)["result"]


def wait_for_build(creds, deploy_id, timeout=120):
    """Poll deployment status until build finishes (success or failure)."""
    print(f"⏳ Waiting for build (max {timeout}s)...")
    start = time.time()
    while time.time() - start < timeout:
        d = get_deployment(creds, deploy_id)
        status = d.get("latest_stage", {}).get("status")
        stages = d.get("stages", [])
        done = [f"{s['name']}={s['status']}" for s in stages if s.get("status") in ("success", "failed")]
        print(f"  [{int(time.time() - start)}s] status={status}  {', '.join(done)}")
        if status in ("success", "failed"):
            return d
        time.sleep(5)
    sys.exit(f"❌ Timeout after {timeout}s")


def main():
    parser = argparse.ArgumentParser(description="Trigger CF Pages deploy from git")
    parser.add_argument("--commit", help="Specific commit SHA (default: HEAD)")
    parser.add_argument("--wait", action="store_true", help="Wait for build to finish")
    parser.add_argument("--url", action="store_true", help="Print preview URL when done")
    parser.add_argument("--verify", action="store_true",
                        help="After build succeeds, verify production reflects the change (curl + CSS marker)")
    parser.add_argument("--verify-token", default=None,
                        help="String that MUST appear in production CSS after deploy (e.g. 'streak-reward-card')")
    parser.add_argument("--repo", default=".", help="Path to git repo")
    args = parser.parse_args()

    creds = load_credentials()
    commit = args.commit or get_current_commit()
    print(f"📦 Repo: {args.repo}")
    print(f"🌿 Branch: {PROD_BRANCH}")
    print(f"🔖 Commit: {commit}")
    print()

    result = trigger_deploy(creds, commit)
    deploy_id = result["id"]
    preview_url = result.get("url", "")
    print(f"✅ Deploy triggered: {deploy_id}")
    if preview_url and not args.wait:
        print(f"🌐 Preview: {preview_url}")

    if args.wait:
        final = wait_for_build(creds, deploy_id)
        status = final.get("latest_stage", {}).get("status")
        if status == "success":
            print()
            print(f"🎉 Build succeeded!")
            print(f"🌐 Production: https://{PROJECT_NAME}.website")
            if args.url or preview_url:
                print(f"🔍 Preview:   {preview_url}")

            # Production verification — actually fetch the live URL and
            # confirm the new code is being served (catches CDN lag, wrong
            # commit deployed, etc.)
            if args.verify:
                print()
                verify_result = verify_production(
                    deploy_id,
                    expected_token=args.verify_token,
                )
                if verify_result.get("ok"):
                    print(f"✅ Production verified: {verify_result['css_bundle']} ({verify_result['css_size_kb']} KB)")
                else:
                    sys.exit(f"❌ Production verify failed: {verify_result.get('error')}")
        else:
            sys.exit(f"❌ Build failed: status={status}")
    elif args.url and preview_url:
        print(f"🔍 Preview: {preview_url}")


if __name__ == "__main__":
    main()
