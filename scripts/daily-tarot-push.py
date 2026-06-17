#!/usr/bin/env python3
"""
STARVIA Daily Tarot Push
Sends daily tarot card to Telegram channel

Usage:
  python3 daily-tarot-push.py [--channel telegram] [--user user_id]
"""

import json
import random
import urllib.request
from datetime import datetime

# Tarot cards data (subset for daily push)
DAILY_CARDS = [
    {"id": 0, "name": "The Fool", "thai": "ผู้เริ่มต้น", "emoji": "🃏", "meaning": "ช่วงเวลาแห่งการเริ่มต้นใหม่ — เปิดใจ กล้าได้กล้าเสีย สิ่งดีๆ กำลังมา"},
    {"id": 1, "name": "The Magician", "thai": "นักมายากล", "emoji": "🪄", "meaning": "คุณมีทุกอย่างที่จำเป็นในการทำสิ่งที่ต้องการ — แค่ลงมือทำ"},
    {"id": 2, "name": "The High Priestess", "thai": "นักบวชหญิง", "emoji": "🌙", "meaning": "ใช้สัญชาตญาณนำทาง — คำตอบอยู่ภายในตัวคุณแล้ว"},
    {"id": 3, "name": "The Empress", "thai": "จักรพรรดินี", "emoji": "👑", "meaning": "ความอุดมสมบูรณ์กำลังมา ดูแลตัวเองและคนรอบข้าง"},
    {"id": 4, "name": "The Emperor", "thai": "จักรพรรดิ์", "emoji": "🏛️", "meaning": "ความมั่นคงและระเบียบจะนำพาไปสู่ความสำเร็จ"},
    {"id": 5, "name": "The Hierophant", "thai": "สันตะปาปา", "emoji": "📿", "meaning": "เรียนรู้จากผู้มีประสบการณ์ ความรู้คือพลัง"},
    {"id": 6, "name": "The Lovers", "thai": "คนรัก", "emoji": "💕", "meaning": "ความรักและความสัมพันธ์กำลังเบ่งบาน ให้เวลาและความใส่ใจ"},
    {"id": 7, "name": "The Chariot", "thai": "รถม้า", "emoji": "🏇", "meaning": "มุ่งมั่นไปข้างหน้า ความสำเร็จอยู่ไม่ไกล"},
    {"id": 8, "name": "Strength", "thai": "ความเข้มแข็ง", "emoji": "🦁", "meaning": "ความแข็งแกร่งภายในจะนำพาผ่านทุกอุปสรรค"},
    {"id": 9, "name": "The Hermit", "thai": "ฤาษี", "emoji": "🏮", "meaning": "ใช้เวลาอยู่กับตัวเอง ค้นหาคำตอบภายใน"},
    {"id": 10, "name": "Wheel of Fortune", "thai": "วงล้อแห่งโชค", "emoji": "🎡", "meaning": "โชคชะตากำลังหมุนไปในทิศทางที่ดี"},
    {"id": 11, "name": "Justice", "thai": "ความยุติธรรม", "emoji": "⚖️", "meaning": "ความจริงและความยุติธรรมจะชนะในที่สุด"},
    {"id": 12, "name": "The Hanged Man", "thai": "คนถูกแขวน", "emoji": "🙃", "meaning": "มองโลกจากมุมใหม่ บางทีการหยุดพักคือสิ่งที่ดีที่สุด"},
    {"id": 13, "name": "Death", "thai": "การเปลี่ยนแปลง", "emoji": "🦋", "meaning": "การเปลี่ยนแปลงคือการเริ่มต้นใหม่ ปล่อยวางสิ่งเก่า"},
    {"id": 14, "name": "Temperance", "thai": "ความพอดี", "emoji": "⏳", "meaning": "ความสมดุลคือกุญแจ อย่าสุดโต่งจนเกินไป"},
    {"id": 15, "name": "The Devil", "thai": "ปีศาจ", "emoji": "😈", "meaning": "ระวังกับดักที่ล่อใจ ปลดปล่อยตัวเองจากสิ่งที่ผูกมัด"},
    {"id": 16, "name": "The Tower", "thai": "หอคอย", "emoji": "🗼", "meaning": "การเปลี่ยนแปลงฉับพลันอาจน่ากลัว แต่นำไปสู่สิ่งที่ดีกว่า"},
    {"id": 17, "name": "The Star", "thai": "ดาว", "emoji": "⭐", "meaning": "ความหวังและแรงบันดาลใจกำลังส่องแสง ทำตามดาวนำทาง"},
    {"id": 18, "name": "The Moon", "thai": "จันทร์", "emoji": "🌕", "meaning": "สิ่งที่ซ่อนเร้นกำลังจะถูกเปิดเผย ไว้ใจสัญชาตญาณ"},
    {"id": 19, "name": "The Sun", "thai": "ดวงอาทิตย์", "emoji": "☀️", "meaning": "ความสุขและความสำเร็จกำลังมาถึง ยิ้มรับไว้"},
    {"id": 20, "name": "Judgement", "thai": "การตัดสิน", "emoji": "📯", "meaning": "เวลาแห่งการตัดสินใจมาถึง ฟังเสียงภายใน"},
    {"id": 21, "name": "The World", "thai": "โลก", "emoji": "🌍", "meaning": "เป้าหมายกำลังจะสำเร็จ ภารกิจใกล้จบแล้ว"},
]

def get_daily_card():
    """Get card for today based on date"""
    today = datetime.now()
    day_of_year = today.timetuple().tm_yday
    index = day_of_year % len(DAILY_CARDS)
    return DAILY_CARDS[index]

def send_telegram(bot_token, chat_id, card, orientation='up'):
    """Send daily card to Telegram"""
    ori_text = "ตั้ง ⬆️" if orientation == 'up' else "กลับหัว ⬇️"
    
    message = f"""🃏 ไพ่ประจำวัน STARVIA
📅 {datetime.now().strftime('%d %b %Y')}

{card['emoji']} {card['thai']} ({card['name']})
{'ตั้ง ⬆️' if orientation == 'up' else 'กลับหัว ⬇️'}

✨ คำทำนาย:
{card['meaning']}

━━━━━━━━━━━━━━━━━━

ดูดวงฟรีทุกวัน
starvia.website

#STARVIA #ไพ่ประจำวัน"""
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    data = json.dumps({
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML'
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def main():
    import argparse
    parser = argparse.ArgumentParser(description='STARVIA Daily Tarot Push')
    parser.add_argument('--bot-token', help='Telegram bot token')
    parser.add_argument('--chat-id', help='Telegram chat ID')
    parser.add_argument('--print-only', action='store_true', help='Print only, do not send')
    
    args = parser.parse_args()
    
    card = get_daily_card()
    orientation = random.choice(['up', 'down'])
    
    if args.print_only:
        print(f"🃏 ไพ่ประจำวัน STARVIA")
        print(f"📅 {datetime.now().strftime('%d %b %Y')}")
        print(f"\n{card['emoji']} {card['thai']} ({card['name']})")
        print(f"{'ตั้ง ⬆️' if orientation == 'up' else 'กลับหัว ⬇️'}")
        print(f"\n✨ คำทำนาย:")
        print(f"{card['meaning']}")
    else:
        if not args.bot_token or not args.chat_id:
            print("Error: --bot-token and --chat-id required")
            return
        
        result = send_telegram(args.bot_token, args.chat_id, card, orientation)
        print(f"✅ Sent daily card to Telegram: {result}")

if __name__ == '__main__':
    main()
