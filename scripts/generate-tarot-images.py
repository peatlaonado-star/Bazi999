#!/usr/bin/env python3
"""
Generate tarot card images with dark cosmic background
Uses Pillow to create card images with symbols and Thai text
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Card data
CARDS = [
    {"id": 0, "name": "The Fool", "thai": "ผู้เริ่มต้น", "symbol": "0", "emoji": "🃏", "color": "#F4D987"},
    {"id": 1, "name": "The Magician", "thai": "นักมายากล", "symbol": "I", "emoji": "🪄", "color": "#E8534A"},
    {"id": 2, "name": "The High Priestess", "thai": "นักบวชหญิง", "symbol": "II", "emoji": "🌙", "color": "#C8DCF0"},
    {"id": 3, "name": "The Empress", "thai": "จักรพรรดินี", "symbol": "III", "emoji": "👑", "color": "#FFD700"},
    {"id": 4, "name": "The Emperor", "thai": "จักรพรรดิ์", "symbol": "IV", "emoji": "🏛️", "color": "#8B4513"},
    {"id": 5, "name": "The Hierophant", "thai": "สันตะปาปา", "symbol": "V", "emoji": "📿", "color": "#9370DB"},
    {"id": 6, "name": "The Lovers", "thai": "คนรัก", "symbol": "VI", "emoji": "💕", "color": "#FF69B4"},
    {"id": 7, "name": "The Chariot", "thai": "รถม้า", "symbol": "VII", "emoji": "🏇", "color": "#4169E1"},
    {"id": 8, "name": "Strength", "thai": "ความเข้มแข็ง", "symbol": "VIII", "emoji": "🦁", "color": "#FFA500"},
    {"id": 9, "name": "The Hermit", "thai": "ฤาษี", "symbol": "IX", "emoji": "🏮", "color": "#808080"},
    {"id": 10, "name": "Wheel of Fortune", "thai": "วงล้อแห่งโชค", "symbol": "X", "emoji": "🎡", "color": "#FFD700"},
    {"id": 11, "name": "Justice", "thai": "ความยุติธรรม", "symbol": "XI", "emoji": "⚖️", "color": "#228B22"},
    {"id": 12, "name": "The Hanged Man", "thai": "คนถูกแขวน", "symbol": "XII", "emoji": "🙃", "color": "#4682B4"},
    {"id": 13, "name": "Death", "thai": "การเปลี่ยนแปลง", "symbol": "XIII", "emoji": "🦋", "color": "#2F4F4F"},
    {"id": 14, "name": "Temperance", "thai": "ความพอดี", "symbol": "XIV", "emoji": "⏳", "color": "#DDA0DD"},
    {"id": 15, "name": "The Devil", "thai": "ปีศาจ", "symbol": "XV", "emoji": "😈", "color": "#8B0000"},
    {"id": 16, "name": "The Tower", "thai": "หอคอย", "symbol": "XVI", "emoji": "🗼", "color": "#FF4500"},
    {"id": 17, "name": "The Star", "thai": "ดาว", "symbol": "XVII", "emoji": "⭐", "color": "#00CED1"},
    {"id": 18, "name": "The Moon", "thai": "จันทร์", "symbol": "XVIII", "emoji": "🌕", "color": "#C0C0C0"},
    {"id": 19, "name": "The Sun", "thai": "ดวงอาทิตย์", "symbol": "XIX", "emoji": "☀️", "color": "#FFD700"},
    {"id": 20, "name": "Judgement", "thai": "การตัดสิน", "symbol": "XX", "emoji": "📯", "color": "#FFD700"},
    {"id": 21, "name": "The World", "thai": "โลก", "symbol": "XXI", "emoji": "🌍", "color": "#32CD32"},
]

# Card dimensions (4:5 ratio for Facebook)
CARD_WIDTH = 400
CARD_HEIGHT = 500

# Colors
BG_COLOR = (9, 6, 28)  # #09061c - dark cosmic
GOLD_COLOR = (201, 162, 39)  # #c9a227
TEXT_COLOR = (248, 241, 223)  # #F8F1DF

def create_card_image(card, output_dir):
    """Create a single tarot card image"""
    # Create image with dark background
    img = Image.new('RGB', (CARD_WIDTH, CARD_HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Draw border
    border_color = tuple(int(card['color'][i:i+2], 16) for i in (1, 3, 5))
    draw.rectangle([10, 10, CARD_WIDTH-10, CARD_HEIGHT-10], outline=border_color, width=3)
    
    # Draw inner border
    draw.rectangle([20, 20, CARD_WIDTH-20, CARD_HEIGHT-20], outline=GOLD_COLOR, width=1)
    
    # Draw symbol (large)
    try:
        # Try to use a larger font for symbol
        symbol_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
    except:
        symbol_font = ImageFont.load_default()
    
    # Draw symbol centered
    symbol = card['symbol']
    bbox = draw.textbbox((0, 0), symbol, font=symbol_font)
    symbol_width = bbox[2] - bbox[0]
    symbol_x = (CARD_WIDTH - symbol_width) // 2
    draw.text((symbol_x, 80), symbol, fill=GOLD_COLOR, font=symbol_font)
    
    # Draw emoji (medium)
    try:
        emoji_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 48)
    except:
        emoji_font = ImageFont.load_default()
    
    emoji = card['emoji']
    bbox = draw.textbbox((0, 0), emoji, font=emoji_font)
    emoji_width = bbox[2] - bbox[0]
    emoji_x = (CARD_WIDTH - emoji_width) // 2
    draw.text((emoji_x, 180), emoji, fill=TEXT_COLOR, font=emoji_font)
    
    # Draw Thai name
    try:
        thai_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    except:
        thai_font = ImageFont.load_default()
    
    thai_name = card['thai']
    bbox = draw.textbbox((0, 0), thai_name, font=thai_font)
    thai_width = bbox[2] - bbox[0]
    thai_x = (CARD_WIDTH - thai_width) // 2
    draw.text((thai_x, 280), thai_name, fill=TEXT_COLOR, font=thai_font)
    
    # Draw English name
    try:
        en_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except:
        en_font = ImageFont.load_default()
    
    en_name = card['name']
    bbox = draw.textbbox((0, 0), en_name, font=en_font)
    en_width = bbox[2] - bbox[0]
    en_x = (CARD_WIDTH - en_width) // 2
    draw.text((en_x, 320), en_name, fill=GOLD_COLOR, font=en_font)
    
    # Draw decorative elements
    draw.line([50, 360, CARD_WIDTH-50, 360], fill=GOLD_COLOR, width=1)
    draw.line([50, 370, CARD_WIDTH-50, 370], fill=GOLD_COLOR, width=1)
    
    # Save image
    filename = f"card-{card['id']:02d}.png"
    filepath = os.path.join(output_dir, filename)
    img.save(filepath, 'PNG')
    print(f"Created: {filename}")
    return filepath

def main():
    output_dir = os.path.expanduser("~/Starvia/images/tarot")
    os.makedirs(output_dir, exist_ok=True)
    
    print("🎴 Generating Tarot Card Images...")
    print(f"Output directory: {output_dir}")
    print()
    
    created = 0
    for card in CARDS:
        try:
            create_card_image(card, output_dir)
            created += 1
        except Exception as e:
            print(f"Error creating card {card['id']}: {e}")
    
    print(f"\n✅ Created {created}/{len(CARDS)} card images")

if __name__ == '__main__':
    main()
