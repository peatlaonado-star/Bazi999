#!/usr/bin/env python3
"""
STARVIA Preview-to-Telegram
============================
Deploy a commit, screenshot the preview URL, and send the result
back to Telegram so you can review on mobile before pushing to
production.

Usage:
    python3 scripts/preview.py [--commit SHA] [--pages 1,2,3]

Flow:
    1. Trigger deploy via CF Pages API (does NOT push to prod)
    2. Wait for build (~18s typical)
    3. Screenshot preview URL on mobile (390x844) and desktop (1280x800)
    4. Send photos + summary to Telegram
"""
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8707386838:AAG6p0dawQl9zCNZ5Y1TllpFpZ30meB8g00")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_HOME_CHANNEL", "6028926845")
HERMES_ENV = Path.home() / ".hermes" / "cloudflare.env"
PROJECT_NAME = "starvia"
CF_API_BASE = "https://api.cloudflare.com/client/v4"
PREVIEW_DIR = Path("/tmp/starvia_previews")

# Pages to screenshot — each is a (slug, label) pair
DEFAULT_PAGES = [
    ("", "หน้าแรก"),
]

# ── Helpers ────────────────────────────────────────────────────────────

def load_credentials():
    """Load CF API credentials from ~/.hermes/cloudflare.env."""
    if not HERMES_ENV.exists():
        sys.exit(f"❌ Missing {HERMES_ENV}")
    creds = {}
    for line in HERMES_ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        creds[k.strip()] = v.strip()
    if creds.get("CLOUDFLARE_API_EMAIL") and not creds.get("CLOUDFLARE_EMAIL"):
        creds["CLOUDFLARE_EMAIL"] = creds["CLOUDFLARE_API_EMAIL"]
    required = ["CLOUDFLARE_API_KEY", "CLOUDFLARE_EMAIL", "CLOUDFLARE_ACCOUNT_ID"]
    missing = [k for k in required if not creds.get(k)]
    if missing:
        sys.exit(f"❌ Missing in {HERMES_ENV}: {', '.join(missing)}")
    return creds


def cf_request(method, path, creds, body=None):
    url = f"{CF_API_BASE}{path}"
    headers = {
        "X-Auth-Email": creds.get("CLOUDFLARE_EMAIL") or creds.get("CLOUDFLARE_API_EMAIL"),
        "X-Auth-Key": creds["CLOUDFLARE_API_KEY"],
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def git(*args, repo="."):
    out = subprocess.run(
        ["git", "-C", str(repo), *args],
        capture_output=True, text=True, check=True, timeout=10,
    )
    return out.stdout.strip()


def send_telegram_photo(photo_path, caption=""):
    """Send a photo via Telegram Bot API."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
    with open(photo_path, "rb") as f:
        data = urllib.parse.urlencode({
            "chat_id": TELEGRAM_CHAT_ID,
            "caption": caption[:1024],  # Telegram caption limit
        }).encode()
        req = urllib.request.Request(
            url,
            data=urllib.parse.urlencode({
                "chat_id": TELEGRAM_CHAT_ID,
                "caption": caption[:1024],
            }).encode() + b"\r\n",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        # Use multipart for photo upload
        import http.client
        import mimetypes
        boundary = "----starviapreviewboundary"
        body = []
        body.append(f"--{boundary}\r\n".encode())
        body.append(
            f'Content-Disposition: form-data; name="chat_id"\r\n\r\n{TELEGRAM_CHAT_ID}\r\n'.encode()
        )
        body.append(f"--{boundary}\r\n".encode())
        body.append(
            f'Content-Disposition: form-data; name="caption"\r\n\r\n{caption[:1024]}\r\n'.encode()
        )
        body.append(f"--{boundary}\r\n".encode())
        body.append(
            f'Content-Disposition: form-data; name="photo"; filename="{Path(photo_path).name}"\r\n'.encode()
        )
        body.append(b"Content-Type: image/png\r\n\r\n")
        body.append(Path(photo_path).read_bytes())
        body.append(f"\r\n--{boundary}--\r\n".encode())
        body_all = b"".join(body)
        req = urllib.request.Request(
            url,
            data=body_all,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read().decode())
            if not resp.get("ok"):
                print(f"  ⚠️ Telegram error: {resp}")
            return resp.get("ok", False)


def send_telegram_text(text):
    """Send a text message via Telegram Bot API."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = urllib.parse.urlencode({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text[:4096],
        "parse_mode": "HTML",
        "disable_web_page_preview": "true",
    }).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=15) as r:
        resp = json.loads(r.read().decode())
        return resp.get("ok", False)


# ── Deploy + screenshot ───────────────────────────────────────────────

def trigger_deploy(creds, commit_sha):
    body = {
        "deployment_trigger": {
            "type": "ad_hoc",
            "metadata": {"branch": "main"},
        }
    }
    path = f"/accounts/{creds['CLOUDFLARE_ACCOUNT_ID']}/pages/projects/{PROJECT_NAME}/deployments"
    print(f"🚀 Triggering deploy for commit {commit_sha[:10]}...")
    resp = cf_request("POST", path, creds, body=body)
    if not resp.get("success"):
        sys.exit(f"❌ Deploy trigger failed: {resp}")
    return resp["result"]


def wait_for_build(creds, deploy_id, timeout=120):
    path = f"/accounts/{creds['CLOUDFLARE_ACCOUNT_ID']}/pages/projects/{PROJECT_NAME}/deployments/{deploy_id}"
    print(f"⏳ Waiting for build (max {timeout}s)...")
    start = time.time()
    while time.time() - start < timeout:
        d = cf_request("GET", path, creds)["result"]
        status = d.get("latest_stage", {}).get("status")
        if status in ("success", "failed"):
            return d
        time.sleep(4)
    sys.exit(f"❌ Timeout after {timeout}s")


def screenshot(url, out_path, viewport):
    """Take a screenshot of a URL with given viewport size."""
    from playwright.sync_api import sync_playwright
    os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", str(Path.home() / ".cache/ms-playwright"))
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport=viewport,
            device_scale_factor=1,  # smaller PNGs (was 2)
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        )
        page = ctx.new_page()
        try:
            page.goto(url, wait_until="networkidle", timeout=20000)
        except Exception:
            page.goto(url, wait_until="domcontentloaded", timeout=20000)
        # Let the app hydrate + streak tracker run
        page.wait_for_timeout(2500)
        # Above-the-fold only by default to keep PNGs small (Telegram-friendly).
        # full_page=True captures entire scroll height — files balloon to 2-4 MB.
        page.screenshot(path=str(out_path), full_page=False)
        browser.close()


# ── Main ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Deploy + screenshot preview, send to Telegram")
    parser.add_argument("--commit", help="Specific commit SHA (default: HEAD)")
    parser.add_argument("--pages", default="",
                        help="Comma-separated paths to screenshot, e.g. ',reports' (default: home only)")
    parser.add_argument("--no-send", action="store_true",
                        help="Skip Telegram send (just deploy + screenshot locally)")
    parser.add_argument("--repo", default="/home/kara/Starvia", help="Path to git repo")
    args = parser.parse_args()

    creds = load_credentials()
    commit = args.commit or git("rev-parse", "HEAD", repo=args.repo)
    short_commit = commit[:10]
    commit_msg = git("log", "-1", "--pretty=%s", repo=args.repo)
    print(f"📦 Commit: {short_commit} | {commit_msg}\n")

    # 1. Deploy
    result = trigger_deploy(creds, commit)
    deploy_id = result["id"]
    preview_url = result.get("url", "")
    if not preview_url:
        sys.exit("❌ No preview URL returned")
    print(f"✅ Deploy: {deploy_id}")
    print(f"🔍 Preview: {preview_url}\n")

    # 2. Wait
    final = wait_for_build(creds, deploy_id)
    status = final.get("latest_stage", {}).get("status")
    if status != "success":
        sys.exit(f"❌ Build failed: status={status}")
    print(f"🎉 Build succeeded!\n")

    # 3. Screenshot
    PREVIEW_DIR.mkdir(exist_ok=True)
    paths = [p.strip() for p in args.pages.split(",")] if args.pages else [""]
    paths = paths or [""]

    print("📸 Taking screenshots...")
    screenshots = []
    for path in paths:
        url = preview_url.rstrip("/") + ("/" + path.lstrip("/") if path else "")
        label = path or "home"
        for view, vw, vh in [("mobile", 390, 844), ("desktop", 1280, 800)]:
            out = PREVIEW_DIR / f"{short_commit}_{label}_{view}.png"
            try:
                screenshot(url, out, {"width": vw, "height": vh})
                size_kb = out.stat().st_size // 1024
                print(f"  ✓ {out.name} ({size_kb} KB) [{vw}x{vh}]")
                screenshots.append((label, view, out, url))
            except Exception as e:
                print(f"  ✗ {label} {view}: {e}")

    if not screenshots:
        sys.exit("❌ No screenshots captured")

    # 4. Send to Telegram
    if args.no_send:
        print(f"\n📁 Screenshots saved to {PREVIEW_DIR}/")
        return

    print("\n📤 Sending to Telegram...")
    summary = (
        f"🔍 <b>Preview Ready</b>\n\n"
        f"📝 {commit_msg}\n"
        f"🔖 <code>{short_commit}</code>\n"
        f"🔗 {preview_url}\n"
    )
    if send_telegram_text(summary):
        print(f"  ✓ Summary sent")

    for label, view, path, url in screenshots:
        cap = f"<b>{label}</b> · {view}\n{url}"
        if send_telegram_photo(path, cap):
            print(f"  ✓ {path.name} sent")
        time.sleep(0.5)

    print(f"\n✅ Done! Open {preview_url} on your phone to test live.")


if __name__ == "__main__":
    main()
