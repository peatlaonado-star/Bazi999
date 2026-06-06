#!/usr/bin/env python3
"""
STARVIA Product Tour — Storytelling screenshots for Telegram
============================================================
Captures 3-4 hero screens of the live Starvia site and sends them
to Telegram as a "narrative carousel" — each caption tells one beat
of the user journey (welcome → daily → report → couple).

Usage:
    python3 scripts/tour.py                  # default: tour current prod
    python3 scripts/tour.py --url https://X.starvia-c8s.pages.dev  # tour a preview deploy
    python3 scripts/tour.py --no-send         # save locally, skip Telegram
    python3 scripts/tour.py --tour-short     # 3 screens (skip couple)

Flow (per screen):
    1. Navigate browser to base URL
    2. Set localStorage state to simulate the right user stage
    3. Reload, wait for hydration
    4. Screenshot above-the-fold
    5. Send photo + storytelling caption to Telegram
"""
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8707386838:AAG6p0dawQl9zCNZ5Y1TllpFpZ30meB8g00")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_HOME_CHANNEL", "6028926845")
DEFAULT_BASE_URL = "https://starvia.website"
TOUR_DIR = Path("/tmp/starvia_tour")

# ── Telegram helpers ───────────────────────────────────────────────────

def tg_send_photo(photo_path, caption):
    boundary = "----tourboundary"
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

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
    req = urllib.request.Request(
        url, data=b"".join(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        resp = json.loads(r.read().decode())
        return resp.get("ok", False)


def tg_send_text(text):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = urllib.parse.urlencode({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text[:4096],
        "parse_mode": "HTML",
        "disable_web_page_preview": "true",
    }).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode()).get("ok", False)


# ── Tour stops ─────────────────────────────────────────────────────────
# Each stop is (id, label, setup_fn, caption_fn) where:
#   - setup_fn(page, base_url) → sets localStorage + navigates
#   - caption_fn → returns a storytelling caption string

def setup_welcome(page, base_url):
    """Stop 1: Welcome overlay. New user, no localStorage."""
    page.goto(base_url, wait_until="domcontentloaded", timeout=20000)
    page.evaluate("() => { try { localStorage.clear(); } catch(e) {} }")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(2500)


def setup_daily(page, base_url):
    """Stop 2: Daily fortune on the landing page. Returning user
    (no overlay), shows today's fortune + form card."""
    page.goto(base_url, wait_until="domcontentloaded", timeout=20000)
    # Seed minimal onboarding state so we skip the welcome overlay but
    # the daily fortune widget still renders.
    page.evaluate("""() => {
      try {
        localStorage.setItem('starvia_onboarding', JSON.stringify({
          startedAt: new Date().toISOString(),
          step: 1,
          birthData: { name: 'ทดสอบ', dob: '1990-06-15', time: '12:00', gender: 'female' }
        }));
      } catch(e) {}
    }""")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(2500)


def setup_report(page, base_url):
    """Stop 3: Personalized report (4 tabs). User has completed
    onboarding — full reading + tabbed deep-dive is visible."""
    page.goto(base_url, wait_until="domcontentloaded", timeout=20000)
    page.evaluate("""() => {
      try {
        // Seed onboarding state to skip overlay
        localStorage.setItem('starvia_onboarding', JSON.stringify({
          startedAt: new Date().toISOString(),
          step: 2,
          birthData: { name: 'แพร', dob: '1990-06-15', time: '14:30', gender: 'female' }
        }));
        // Auto-fill the form + trigger reading
        setTimeout(() => {
          try {
            const n = document.getElementById('n0');
            const d = document.getElementById('d0');
            const t = document.getElementById('t0');
            const g = document.getElementById('g0');
            if (n) n.value = 'แพร';
            if (d) d.value = '1990-06-15';
            if (t) t.value = '14:30';
            if (g) g.value = 'female';
            if (typeof go0 === 'function') go0();
          } catch(e) {}
        }, 200);
      } catch(e) {}
    }""")
    page.reload(wait_until="domcontentloaded")
    # Wait long enough for form-fill + reading render
    page.wait_for_timeout(4500)
    # Scroll the report into view (it renders below the fold)
    try:
        report = page.query_selector('#ind-result, .ind-report, [data-report]')
        if report:
            report.scroll_into_view_if_needed()
            page.wait_for_timeout(1500)
    except Exception:
        pass


def setup_couple(page, base_url):
    """Stop 4: Couple compatibility. Two people, shared insight."""
    page.goto(base_url, wait_until="domcontentloaded", timeout=20000)
    page.evaluate("""() => {
      try {
        localStorage.setItem('starvia_onboarding', JSON.stringify({
          startedAt: new Date().toISOString(),
          step: 2,
          birthData: { name: 'แพร', dob: '1990-06-15', time: '14:30', gender: 'female' }
        }));
      } catch(e) {}
    }""")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(2500)
    # Click the "ดูดวงคู่" tab/button
    try:
        couple_btn = page.query_selector('button:has-text("ดูดวงคู่")')
        if not couple_btn:
            couple_btn = page.query_selector('[data-tab="couple"], #couple-tab, [data-mode="couple"]')
        if couple_btn:
            couple_btn.click()
            page.wait_for_timeout(2500)
    except Exception:
        pass


# ── Captions (storytelling) ────────────────────────────────────────────

CAPTION_INTRO = (
    "🌟 <b>STARVIA — Product Tour</b>\n\n"
    "4 ภาพเล่าเรื่อง: เริ่มต้น → รู้จักตัวเอง → รู้จักคนรอบข้าง\n\n"
    "อ่านนะคะ ทุกข้อความมีที่มา 🐶"
)

CAPTIONS = {
    "welcome": (
        "📖 <b>บทที่ 1 — เริ่มต้น</b>\n\n"
        "คุณเปิดเว็บ → 30 วินาทีถัดไป ดาวจะรู้จักคุณ\n\n"
        "กรอกแค่ 4 อย่าง: ชื่อ · วันเกิด · เวลา · เพศ\n"
        "ไม่ต้องสมัครสมาชิก ไม่ต้องจ่าย ไม่ต้องกรอกอีเมล\n\n"
        "✨ <i>จุดเริ่มต้นของทุกอย่างอยู่ตรงนี้</i>"
    ),
    "daily": (
        "📖 <b>บทที่ 2 — วันนี้</b>\n\n"
        "ดวงวันนี้เปลี่ยนทุกวัน — ตามดาวจริง ไม่ใช่แค่คำทำนายทั่วไป\n\n"
        "🔮 ธาตุประจำวัน\n"
        "🎯 สิ่งที่ควรโฟกัส\n"
        "🔢 เลขนำโชค\n"
        "⏰ เวลาเฮง\n\n"
        "✨ <i>ดาวส่งข้อความถึงคุณทุกเช้า</i>"
    ),
    "report": (
        "📖 <b>บทที่ 3 — รู้จักตัวเอง</b>\n\n"
        "พิมพ์เขียวชีวิต — 4 มิติจากโหราศาสตร์ไทยโบราณ\n\n"
        "🌟 ตัวตน — นิสัย จุดแข็ง จุดที่ต้องระวัง\n"
        "💕 ความรัก — สไตล์รัก คนที่ใช่ ช่วงเวลาดี\n"
        "💼 งาน/เงิน — จุดเด่น การเงิน ฤกษ์ลงทุน\n"
        "🌙 ฤกษ์ดี — วัน-เวลาที่ดาวเปิดทาง\n\n"
        "✨ <i>รู้จักตัวเองลึกกว่าที่เคยรู้</i>"
    ),
    "couple": (
        "📖 <b>บทที่ 4 — คนรอบข้าง</b>\n\n"
        "เช็กดวงคู่ — คุณกับคนที่ใช่ เข้ากันได้แค่ไหน?\n\n"
        "💕 ความเข้ากัน 4 มิติ\n"
        "🪐 ดาวเจ้าของเรือนคู่ — ใครเหมาะกับใคร\n"
        "⚠️ จุดที่ต้องปรับเข้าหากัน\n"
        "✨ เคล็ดลับเสริมดวงคู่\n\n"
        "✨ <i>รักไม่ใช่เรื่องบังเอิญ — ดาวมีคำตอบ</i>"
    ),
}


TOUR_FULL = [
    ("welcome", "เริ่มต้น", setup_welcome),
    ("daily", "วันนี้", setup_daily),
    ("report", "รู้จักตัวเอง", setup_report),
    ("couple", "คนรอบข้าง", setup_couple),
]

TOUR_SHORT = TOUR_FULL[:3]


# ── Main ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Tour STARVIA via Telegram")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help="Base URL to tour (default: production)")
    parser.add_argument("--tour-short", action="store_true", help="3-stop tour (skip couple)")
    parser.add_argument("--no-send", action="store_true", help="Save locally, skip Telegram")
    args = parser.parse_args()

    base_url = args.url
    stops = TOUR_SHORT if args.tour_short else TOUR_FULL
    TOUR_DIR.mkdir(exist_ok=True)

    print(f"📸 STARVIA Product Tour")
    print(f"🌐 Base URL: {base_url}")
    print(f"📋 Stops: {len(stops)} ({', '.join(s[0] for s in stops)})")
    print()

    # Lazy import playwright (only when needed)
    from playwright.sync_api import sync_playwright
    os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", str(Path.home() / ".cache/ms-playwright"))

    screenshots = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            for stop_id, stop_label, setup_fn in stops:
                print(f"  📍 Stop: {stop_id} ({stop_label})")
                ctx = browser.new_context(
                    viewport={"width": 390, "height": 844},
                    device_scale_factor=1,
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                )
                page = ctx.new_page()
                try:
                    setup_fn(page, base_url)
                    out = TOUR_DIR / f"tour_{stop_id}.png"
                    page.screenshot(path=str(out), full_page=False)
                    size_kb = out.stat().st_size // 1024
                    print(f"    ✓ {out.name} ({size_kb} KB)")
                    screenshots.append((stop_id, stop_label, out))
                except Exception as e:
                    print(f"    ✗ {stop_id}: {e}")
                finally:
                    ctx.close()
        finally:
            browser.close()

    if not screenshots:
        sys.exit("❌ No screenshots captured")

    if args.no_send:
        print(f"\n📁 Saved to {TOUR_DIR}/")
        return

    print(f"\n📤 Sending to Telegram...")
    # Intro
    if tg_send_text(CAPTION_INTRO):
        print(f"  ✓ Intro sent")
    time.sleep(0.5)

    # Each stop
    for stop_id, stop_label, photo_path in screenshots:
        cap = CAPTIONS.get(stop_id, f"📖 {stop_label}")
        if tg_send_photo(photo_path, cap):
            print(f"  ✓ {stop_id} sent ({photo_path.stat().st_size // 1024} KB)")
        time.sleep(0.5)

    print(f"\n✅ Tour sent! พ่อดูใน Telegram ได้เลยค่ะ 🐶")


if __name__ == "__main__":
    main()
