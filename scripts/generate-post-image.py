#!/usr/bin/env python3
"""
generate-post-image.py — สร้าง HTML สำหรับ screenshot โพสต์ Starvia

Usage:
  python3 generate-post-image.py --input-json '{"type":"daily","zodiac":"เมถุน","symbol":"♊","date":"21 พ.ค. – 20 มิ.ย.","love":"...","career":"...","lucky":"..."}'

Pipeline:
  1. รับข้อมูลดวงจาก JSON
  2. สร้าง cosmic background ด้วย FLUX.1-schnell (Together AI)
  3. สร้าง HTML overlay ข้อความไทยสวยๆ
  4. แสดง path HTML (ให้ cron ใช้ browser screenshot ต่อ)
"""

import argparse
import json
import os
import sys
import datetime
import subprocess
import base64

# --- Config ---
IMAGES_DIR = os.path.expanduser("/home/kara/Starvia/images")
SCRIPTS_DIR = os.path.expanduser("/home/kara/Starvia/scripts")
os.makedirs(IMAGES_DIR, exist_ok=True)

# --- Zodiac-specific FLUX prompt templates ---
COSMIC_PROMPTS = {
    1: "Aries ram constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    2: "Taurus bull constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    3: "Gemini twin constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    4: "Cancer crab constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    5: "Leo lion constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    6: "Virgo maiden constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    7: "Libra scales constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    8: "Scorpius scorpion constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    9: "Sagittarius archer constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    10: "Capricorn sea-goat constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    11: "Aquarius water-bearer constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details",
    12: "Pisces fish constellation in golden stars on cosmic purple nebula sky, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details"
}

DEFAULT_PROMPT = "cosmic purple nebula sky with golden stars, mystical zodiac tarot art style, celestial glowing symbols, rich gold and deep indigo colors, ethereal atmosphere, intricate ornamental details, divine feminine energy"

ZODIAC_NUMBERS = {
    "เมษ": 1, "พฤษภ": 2, "เมถุน": 3, "กรกฎ": 4,
    "สิงห์": 5, "กันย์": 6, "ตุลย์": 7, "พิจิก": 8,
    "ธนู": 9, "มังกร": 10, "กุมภ์": 11, "มีน": 12
}


def get_together_api_key():
    """Read Together AI API key from .env"""
    env_path = os.path.expanduser("~/.hermes/.env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip().strip("'").strip('"')
                if line.startswith("TOGETHER_API_KEY="):
                    return line.split("=", 1)[1].strip().strip("'").strip('"')
    return os.environ.get("TOGETHER_API_KEY")


def generate_background(zodiac_name, today_str, force=False):
    """Generate cosmic background with FLUX.1-schnell via Together AI"""
    image_path = os.path.join(IMAGES_DIR, f"bg-{today_str}.jpg")
    
    # Reuse if already exists (unless forced)
    if os.path.exists(image_path) and not force:
        return image_path
    
    # Select prompt based on zodiac
    zodiac_num = ZODIAC_NUMBERS.get(zodiac_name, 0)
    prompt = COSMIC_PROMPTS.get(zodiac_num, DEFAULT_PROMPT)
    
    api_key = get_together_api_key()
    if not api_key:
        print("WARNING: No TOGETHER_API_KEY found. Using CSS-only background.", file=sys.stderr)
        return None
    
    try:
        import together
        client = together.Together(api_key=api_key)
        
        response = client.images.generate(
            prompt=prompt,
            model="black-forest-labs/FLUX.1-schnell",
            width=1088,
            height=1344,
            steps=4,
            n=1
        )
        
        b64_data = getattr(response.data[0], 'b64_json', None)
        if b64_data:
            import base64
            with open(image_path, "wb") as f:
                f.write(base64.b64decode(b64_data))
            print(f"  FLUX background saved: {image_path}", file=sys.stderr)
            return image_path
        url = getattr(response.data[0], 'url', None)
        if url:
            # Download with httpx (urllib gets 403 on Together short URLs)
            import httpx
            hclient = httpx.Client()
            resp = hclient.get(url, headers={'Authorization': f'Bearer {api_key}'})
            if resp.status_code == 200:
                with open(image_path, "wb") as f:
                    f.write(resp.content)
                print(f"  FLUX background saved (via httpx): {image_path}", file=sys.stderr)
                return image_path
            else:
                print(f"WARNING: Download failed with status {resp.status_code}", file=sys.stderr)
        print("WARNING: No image data in FLUX response", file=sys.stderr)
        return None
    except Exception as e:
        print(f"WARNING: FLUX generation failed: {e}", file=sys.stderr)
        return None


def image_to_base64(img_path):
    """Convert image file to base64 data URL"""
    if not img_path or not os.path.exists(img_path):
        return None
    with open(img_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def build_html(data, bg_b64=None):
    """Build HTML page with cosmic background + Thai text overlay"""
    
    ptype = data.get("type", "daily")
    zodiac = data.get("zodiac", "")
    symbol = data.get("symbol", "♊")
    date_range = data.get("date", "")
    love = data.get("love", "")
    career = data.get("career", "")
    lucky = data.get("lucky", "")
    link = data.get("link", "starvia.website")
    
    # Background style — FLUX image or CSS nebula fallback
    if bg_b64:
        bg_style = f"""background: url('{bg_b64}') center/cover no-repeat;"""
    else:
        bg_style = """background: radial-gradient(ellipse at 50% 30%, #1a0a3e 0%, #0d0520 40%, #03010e 100%);"""
    
    # Content based on type
    if ptype == "daily":
        content_html = f"""
        <div class="fortune-sections">
          <div class="fortune-item">
            <div class="fortune-icon">💕</div>
            <div class="fortune-item-title">ความรัก</div>
            <div class="fortune-text">{love}</div>
          </div>
          <div class="fortune-item">
            <div class="fortune-icon">💼</div>
            <div class="fortune-item-title">การงาน</div>
            <div class="fortune-text">{career}</div>
          </div>
          <div class="fortune-item">
            <div class="fortune-icon">🍀</div>
            <div class="fortune-item-title">เลขนำโชค</div>
            <div class="fortune-text">{lucky}</div>
          </div>
        </div>"""
        label = "✦ ดวงวันนี้ ✦"
    elif ptype == "couple":
        content_html = f"""
        <div class="fortune-sections">
          <div class="fortune-item">
            <div class="fortune-icon">💞</div>
            <div class="fortune-text">{love}</div>
          </div>
          <div class="fortune-item">
            <div class="fortune-icon">🌙</div>
            <div class="fortune-text">{career}</div>
          </div>
        </div>"""
        label = "✦ ดวงความรักคู่ ✦"
    else:
        content_html = f"""
        <div class="fortune-sections">
          <div class="fortune-item">
            <div class="fortune-icon">🌟</div>
            <div class="fortune-text">{love}</div>
          </div>
          <div class="fortune-item">
            <div class="fortune-icon">⏰</div>
            <div class="fortune-text">{career}</div>
          </div>
        </div>"""
        label = "✦ ฤกษ์ยามมงคล ✦"
    
    # Top art zone height
    art_h = 580

    html = f"""<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>STARVIA — {zodiac}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;600;700;900&amp;display=swap" rel="stylesheet">
<style>
html, body {{
  margin: 0; padding: 0;
  width: 1088px; height: 1344px;
  overflow: hidden;
  font-family: 'Noto Sans Thai', sans-serif;
  background: #0a0612;
}}
.card {{
  width: 1088px; height: 1344px;
  position: relative;
  overflow: hidden;
}}
/* ── TOP ART ZONE (0 – {art_h}px) ── FLUX background + zodiac symbol only */
.art-zone {{
  position: absolute;
  top: 0; left: 0; width: 1088px; height: {art_h}px;
  {bg_style}
  overflow: hidden;
}}
.art-zone::after {{
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom,
    rgba(0,0,0,0.15) 0%,
    rgba(0,0,0,0.05) 40%,
    rgba(10,6,18,0.5) 85%,
    #0a0612 100%);
  pointer-events: none;
}}
/* Stars in art zone only */
.stars {{
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image:
    radial-gradient(1.5px 1.5px at 10% 5%, #fff, transparent),
    radial-gradient(1px 1px at 20% 15%, #ffe5a0, transparent),
    radial-gradient(1px 1px at 35% 8%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 50% 3%, #c8a0ff, transparent),
    radial-gradient(1px 1px at 65% 12%, #fff, transparent),
    radial-gradient(1px 1px at 80% 7%, #ffd080, transparent),
    radial-gradient(1.5px 1.5px at 15% 25%, #fff, transparent),
    radial-gradient(1px 1px at 30% 30%, #ffe5a0, transparent),
    radial-gradient(1px 1px at 60% 28%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 45% 40%, #c8a0ff, transparent),
    radial-gradient(1px 1px at 75% 35%, #fff, transparent),
    radial-gradient(1px 1px at 85% 45%, #ffd080, transparent),
    radial-gradient(1.5px 1.5px at 5% 55%, #fff, transparent),
    radial-gradient(1px 1px at 25% 60%, #c8a0ff, transparent),
    radial-gradient(1px 1px at 55% 50%, #ffe5a0, transparent),
    radial-gradient(1.5px 1.5px at 70% 58%, #fff, transparent);
  background-size: 200px 200px;
  pointer-events: none;
}}
/* Zodiac symbol centered in art zone */
.zodiac-top {{
  position: absolute;
  top: 180px; left: 0; width: 100%;
  text-align: center; z-index: 5;
}}
.zodiac-symbol {{
  font-size: 90px;
  color: rgba(255, 215, 100, 0.92);
  text-shadow: 0 0 30px rgba(255,215,100,0.5), 0 0 60px rgba(255,215,100,0.2);
  line-height: 1;
}}
.zodiac-name {{
  font-size: 26px; font-weight: 700;
  color: #f5d78e;
  text-shadow: 0 0 20px rgba(0,0,0,0.8);
  margin-top: 8px; letter-spacing: 6px;
}}
.zodiac-date {{
  font-size: 15px; font-weight: 300;
  color: rgba(200, 180, 140, 0.8);
  text-shadow: 0 0 10px rgba(0,0,0,0.8);
  margin-top: 4px; letter-spacing: 2px;
}}
/* ── BOTTOM TEXT ZONE ({art_h} – 1344px) ── Solid dark panel, no FLUX */
.text-zone {{
  position: absolute;
  top: {art_h}px; left: 0; width: 1088px;
  height: {1344 - art_h}px;
  background: linear-gradient(to bottom, #0a0612 0%, #120820 50%, #0a0612 100%);
  z-index: 10;
}}
/* Inner border */
.text-zone::before {{
  content: '';
  position: absolute;
  top: 20px; left: 30px; right: 30px; bottom: 20px;
  border: 1px solid rgba(200, 160, 50, 0.25);
  border-radius: 12px;
}}
/* Corner ornaments */
.corner {{
  position: absolute;
  width: 20px; height: 20px;
  border-color: rgba(200, 160, 50, 0.5);
  border-style: solid;
  z-index: 15;
}}
.corner-tl {{ top: 28px; left: 38px; border-width: 2px 0 0 2px; }}
.corner-tr {{ top: 28px; right: 38px; border-width: 2px 2px 0 0; }}
.corner-bl {{ bottom: 28px; left: 38px; border-width: 0 0 2px 2px; }}
.corner-br {{ bottom: 28px; right: 38px; border-width: 0 2px 2px 0; }}
/* Divider between zones */
.zone-divider {{
  position: absolute;
  top: {art_h - 12}px; left: 50%;
  transform: translateX(-50%);
  width: 200px; height: 1px;
  background: linear-gradient(to right, transparent, rgba(200,160,50,0.5), transparent);
  z-index: 12;
}}
.zone-divider-diamond {{
  position: absolute;
  top: {art_h - 17}px; left: 50%;
  transform: translateX(-50%);
  width: 10px; height: 10px;
  background: radial-gradient(circle, #f5d78e, rgba(200,160,50,0.3));
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  z-index: 12;
}}
/* Fortune content */
.fortune-content {{
  position: absolute;
  top: 40px; left: 50px; right: 50px;
  z-index: 20;
}}
.fortune-label {{
  font-size: 13px; font-weight: 600;
  color: rgba(200, 180, 140, 0.6);
  letter-spacing: 4px; text-align: center;
  margin-bottom: 16px;
}}
.fortune-sections {{ display: flex; flex-direction: column; gap: 10px; }}
.fortune-item {{
  text-align: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(200, 160, 50, 0.1);
}}
.fortune-item:last-child {{ border-bottom: none; }}
.fortune-icon {{ font-size: 22px; margin-bottom: 3px; }}
.fortune-item-title {{
  font-size: 12px; font-weight: 700;
  color: rgba(200, 180, 140, 0.55);
  letter-spacing: 3px; margin-bottom: 4px;
}}
.fortune-text {{
  font-size: 17px; font-weight: 400;
  color: rgba(255, 245, 230, 0.88);
  line-height: 1.55; padding: 0 15px;
}}
.description {{ margin-bottom: 14px; }}
.description-text {{
  font-size: 15px; font-weight: 300;
  color: rgba(220, 210, 200, 0.65);
  text-align: center; line-height: 1.55;
  padding: 0 25px; font-style: italic;
}}
/* CTA */
.cta-bottom {{
  position: absolute; bottom: 80px; left: 0; width: 100%;
  text-align: center; z-index: 20;
}}
.cta-text {{
  font-size: 13px; font-weight: 300;
  color: rgba(200, 180, 140, 0.5);
  letter-spacing: 3px; margin-bottom: 3px;
}}
.cta-link {{
  font-size: 16px; font-weight: 600;
  color: #f5d78e; letter-spacing: 2px;
  text-shadow: 0 0 15px rgba(245,215,142,0.2);
}}
.bottom-brand {{
  position: absolute; bottom: 40px; left: 0; width: 100%;
  text-align: center; z-index: 20;
}}
.bottom-brand-text {{
  font-size: 13px; font-weight: 700;
  color: rgba(245, 215, 142, 0.25);
  letter-spacing: 10px;
}}
</style>
</head>
<body>
<div class="card">

  <!-- ═══ TOP: FLUX ART ZONE ═══ -->
  <div class="art-zone">
    <div class="stars"></div>
    <div class="zodiac-top">
      <div class="zodiac-symbol">{symbol}</div>
      <div class="zodiac-name">ราศี{zodiac}</div>
      <div class="zodiac-date">คนเกิด {date_range}</div>
    </div>
  </div>

  <!-- ═══ BOTTOM: TEXT PANEL ZONE ═══ -->
  <div class="text-zone">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <div class="zone-divider"></div>
    <div class="zone-divider-diamond"></div>

    <div class="fortune-content">
      <div class="fortune-label">{label}</div>
      <div class="description">
        <div class="description-text">{data.get('description', '')}</div>
      </div>
      {content_html}
    </div>

    <div class="cta-bottom">
      <div class="cta-text">🌐 ดูดวงเต็มๆ</div>
      <div class="cta-link">{link}</div>
    </div>

    <div class="bottom-brand">
      <div class="bottom-brand-text">✦ STARVIA ✦</div>
    </div>
  </div>

</div>
</body>
</html>"""
    return html


def main():
    parser = argparse.ArgumentParser(description="Generate Starvia post image as HTML")
    parser.add_argument("--input-json", required=True, help="JSON string with post data")
    parser.add_argument("--output", help="Output HTML path (default: auto)")
    parser.add_argument("--no-flux", action="store_true", help="Skip FLUX generation, use CSS background only")
    parser.add_argument("--force-flux", action="store_true", help="Regenerate FLUX even if cached")
    args = parser.parse_args()
    
    # Parse JSON
    data = json.loads(args.input_json)
    zodiac_name = data.get("zodiac", "")
    today_str = datetime.date.today().strftime("%Y%m%d")
    
    # Generate FLUX background
    bg_path = None
    if not args.no_flux:
        bg_path = generate_background(zodiac_name, today_str, force=args.force_flux)
    
    # Convert to base64 for inline use
    bg_b64 = image_to_base64(bg_path) if bg_path else None
    
    # Build HTML
    html = build_html(data, bg_b64=bg_b64)
    
    # Write output
    if args.output:
        out_path = args.output
    else:
        out_path = os.path.join(IMAGES_DIR, f"post-{today_str}.html")
    
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    
    print(out_path)


if __name__ == "__main__":
    main()
