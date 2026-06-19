#!/usr/bin/env python3
"""
STARVIA Content Calendar Generator
Generates daily Facebook posts based on day of week and zodiac data.

Content Calendar:
- Monday-Friday: Daily fortune (12 zodiac signs rotation)
- Saturday: Couple compatibility / Relationship
- Sunday: Auspicious timing / Life decisions

Usage:
  python3 content-calendar.py [--day mon|tue|wed|thu|fri|sat|sun] [--zodiac เมษ|พฤษภ|...]
"""

import json
import random
import sys
from datetime import datetime, timedelta

# ===== ZODIAC DATA =====
ZODIAC_SIGNS = [
    {'name': 'เมษ', 'symbol': '♈', 'element': 'ไฟ', 'ruler': 'อาทิตย์', 'date_range': '21 มี.ค. – 19 เม.ย.'},
    {'name': 'พฤษภ', 'symbol': '♉', 'element': 'ดิน', 'ruler': 'ศุกร์', 'date_range': '20 เม.ย. – 20 พ.ค.'},
    {'name': 'เมถุน', 'symbol': '♊', 'element': 'ลม', 'ruler': 'พุธ', 'date_range': '21 พ.ค. – 20 มิ.ย.'},
    {'name': 'กรกฎ', 'symbol': '♋', 'element': 'น้ำ', 'ruler': 'จันทร์', 'date_range': '21 มิ.ย. – 22 ก.ค.'},
    {'name': 'สิงห์', 'symbol': '♌', 'element': 'ไฟ', 'ruler': 'อาทิตย์', 'date_range': '23 ก.ค. – 22 ส.ค.'},
    {'name': 'กันย์', 'symbol': '♍', 'element': 'ดิน', 'ruler': 'พุธ', 'date_range': '23 ส.ค. – 22 ก.ย.'},
    {'name': 'ตุลย์', 'symbol': '♎', 'element': 'ลม', 'ruler': 'ศุกร์', 'date_range': '23 ก.ย. – 22 ต.ค.'},
    {'name': 'พิจิก', 'symbol': '♏', 'element': 'น้ำ', 'ruler': 'อังคาร', 'date_range': '23 ต.ค. – 21 พ.ย.'},
    {'name': 'ธนู', 'symbol': '♐', 'element': 'ไฟ', 'ruler': 'พฤหัสบดี', 'date_range': '22 พ.ย. – 21 ธ.ค.'},
    {'name': 'มกร', 'symbol': '♑', 'element': 'ดิน', 'ruler': 'เสาร์', 'date_range': '22 ธ.ค. – 19 ม.ค.'},
    {'name': 'กุมภ์', 'symbol': '♒', 'element': 'ลม', 'ruler': 'เสาร์', 'date_range': '20 ม.ค. – 18 ก.พ.'},
    {'name': 'มีน', 'symbol': '♓', 'element': 'น้ำ', 'ruler': 'พฤหัสบดี', 'date_range': '19 ก.พ. – 20 มี.ค.'},
]

# ===== DAILY FORTUNE TEMPLATES =====
DAILY_FORTUNE = {
    'fire': [
        {'love': 'ความรักวันนี้สดใส อาจได้เจอคนใหม่ๆ ที่ทำให้หัวใจเต้นแรง', 'career': 'งานที่ทำอยู่จะได้รับการยอมรับมากขึ้น', 'lucky': 'สีแดง, เลข 9'},
        {'love': 'วันนี้เสน่ห์แรงเป็นพิเศษ ใครๆ ก็อยากอยู่ใกล้', 'career': ' projet ใหม่จะสำเร็จได้ด้วยความมุ่งมั่น', 'lucky': 'สีส้ม, เลข 3'},
        {'love': 'ความรักต้องใช้ความกล้า วันนี้เหมาะจะบอกความรู้สึก', 'career': 'ผู้ใหญ่จะให้โอกาสสำคัญ คว้าไว้', 'lucky': 'สีทอง, เลข 7'},
    ],
    'earth': [
        {'love': 'ความรักมั่นคงดี คุยกันมากขึ้นเข้าใจกันมากขึ้น', 'career': 'งานที่ทำจะสำเร็จตามแผน อดทนอีกนิด', 'lucky': 'สีเหลือง, เลข 4'},
        {'love': 'วันนี้เหมาะพาคนรักไปที่สงบๆ ผ่อนคลาย', 'career': 'การเงินจะมีข่าวดี เก็บออมไว้', 'lucky': 'สีเขียว, เลข 8'},
        {'love': 'ความรักไม่ต้องเร่งรีบ ค่อยๆ เป็นค่อยๆ ไป', 'career': 'รายได้พิเศษจะเข้ามา อย่าลืมเก็บ', 'lucky': 'สีน้ำตาล, เลข 6'},
    ],
    'air': [
        {'love': 'วันนี้สื่อสารกันดี เข้าใจกันมากขึ้น', 'career': 'ไอเดียใหม่ๆ จะผุดขึ้นมา จดไว้ก่อนจะลืม', 'lucky': 'สีฟ้า, เลข 5'},
        {'love': 'ความรักต้องการความอิสระ อย่าผูกมัดกันมากเกินไป', 'career': ' networking วันนี้จะได้ผลดี ออกไปเจอคน', 'lucky': 'สีม่วง, เลข 2'},
        {'love': 'แชร์ความคิดกับคนรัก วันนี้เขาจะเข้าใจคุณ', 'career': 'โปรเจกต์ที่ค้างจะเดินหน้า แค่เริ่มลงมือ', 'lucky': 'สีขาว, เลข 1'},
    ],
    'water': [
        {'love': 'อารมณ์วันนี้ลึกซึ้ง ฟังเสียงหัวใจตัวเอง', 'career': 'สัญชาตญาณจะนำทาง ถ้ารู้สึกว่าใช่ก็ลุย', 'lucky': 'สีน้ำเงิน, เลข 7'},
        {'love': 'ความรักต้องการความใส่ใจ วันนี้เทคแคร์คนรักเป็นพิเศษ', 'career': 'งานที่ต้องใช้จินตนาการจะสำเร็จดี', 'lucky': 'สีเงิน, เลข 9'},
        {'love': 'วันนี้เหมาะอยู่กับตัวเอง พักผ่อน ชาร์จแบต', 'career': 'ปัญหาที่ค้างจะคลี่คลาย แค่อดทน', 'lucky': 'สีน้ำตาลอ่อน, เลข 3'},
    ],
}

# ===== COUPLE COMPATIBILITY =====
COUPLE_THEMES = [
    {
        'title': 'คู่ธาตุไฟ + ลม',
        'hook': 'คุณกับเขาเข้ากันได้ดีเพราะต่างเติมเต็มกัน',
        'detail': 'ธาตุไฟให้พลัง ธาตุลมให้ไอเดีย — อยู่ด้วยแล้วไม่เบื่อ',
        'advice': 'ระวังอย่าทะเลาะกันแรงเกินไป เพราะทั้งคู่มีอารมณ์ร่วมสูง'
    },
    {
        'title': 'คู่ธาตุดิน + น้ำ',
        'hook': 'คุณกับเขาเหมือนต้นไม้กับน้ำ — ต้องมีกันและกัน',
        'detail': 'ธาตุดินให้ความมั่นคง ธาตุน้ำให้ความอบอุ่น — ลงตัว',
        'advice': 'อย่าลืมพาแฟนออกไปผจญภัยบ้าง ไม่งั้นจะจืดชืด'
    },
    {
        'title': 'คู่ธาตุไฟ + ดิน',
        'hook': 'คุณกับเขาต่างกันแต่เสริมกัน',
        'detail': 'ไฟให้พลัง ดินให้ความมั่นคง — อยู่ด้วยแล้วสมดุล',
        'advice': 'ยอมรับความต่าง อย่าพยายามเปลี่ยนกัน'
    },
    {
        'title': 'คู่ธาตุลม + น้ำ',
        'hook': 'คุณกับเขาสื่อสารกันเก่งและเข้าใจอารมณ์กัน',
        'detail': 'ลมให้ไอเดีย น้ำให้ความลึกซึ้ง — คุยได้ทั้งวัน',
        'advice': 'ระวังอย่าคิดมากไป บางทีแค่พูดตรงๆ ก็พอ'
    },
]

# ===== AUSPICIOUS TIMING =====
AUSPICIOUS_THEMES = [
    {
        'title': 'ฤกษ์ดีวันนี้ — เริ่มต้นสิ่งใหม่',
        'hook': 'วันนี้เหมาะเริ่มต้นทำสิ่งที่คิดไว้',
        'detail': 'ดาวพุธโคจรดี ส่งเสริมการสื่อสารและเริ่มต้น',
        'advice': 'ลงมือทำตอนเช้า 09:00-11:00 ได้ผลดีที่สุด'
    },
    {
        'title': 'ฤกษ์ดีวันนี้ — ตัดสินใจเรื่องสำคัญ',
        'hook': 'ถ้ากำลังลังเล วันนี้เหมาะตัดสินใจ',
        'detail': 'ดาวพฤหัสบดีส่งเสริมปัญญา ตัดสินใจได้รอบคอบ',
        'advice': 'ฟังเสียงหัวใจ แต่ใช้เหตุผลคู่กัน'
    },
    {
        'title': 'ฤกษ์ดีวันนี้ — เจรจาต่อรอง',
        'hook': 'วันนี้เหมาะพูดคุยเรื่องสำคัญ',
        'detail': 'ดาวศุกร์ส่งเสริมความสัมพันธ์ พูดอะไรก็สำเร็จ',
        'advice': 'นัดคุยเรื่องเงินเดือน หรือขอโทษคนรัก'
    },
    {
        'title': 'ฤกษ์ดีวันนี้ — เก็บเงิน',
        'hook': 'วันนี้เหมาะเก็บออม หรือลงทุน',
        'detail': 'ดาวเสาร์ส่งเสริมความมั่นคง การเงินคล่องตัว',
        'advice': 'โอนเงินเข้าบัญชีออม หรือซื้อของที่จำเป็น'
    },
]

def get_day_type(day_name=None):
    """Determine content type based on day of week."""
    if day_name is None:
        day_name = datetime.now().strftime('%a').lower()
    
    day_map = {
        'mon': 'daily', 'tue': 'daily', 'wed': 'daily', 'thu': 'daily', 'fri': 'daily',
        'sat': 'couple', 'sun': 'auspicious'
    }
    return day_map.get(day_name, 'daily')

def get_zodiac_for_day(day_offset=0):
    """Get zodiac sign for today based on rotation."""
    today = datetime.now() + timedelta(days=day_offset)
    day_of_year = today.timetuple().tm_yday
    index = day_of_year % 12
    return ZODIAC_SIGNS[index]

def generate_daily_fortune(zodiac=None):
    """Generate daily fortune post."""
    if zodiac is None:
        zodiac = get_zodiac_for_day()
    
    element = zodiac['element']
    fortune_pool = DAILY_FORTUNE.get(element, DAILY_FORTUNE['fire'])
    fortune = random.choice(fortune_pool)
    
    today = datetime.now()
    date_str = today.strftime('%d %b %Y').replace('Jan', 'ม.ค.').replace('Feb', 'ก.พ.').replace('Mar', 'มี.ค.').replace('Apr', 'เม.ย.').replace('May', 'พ.ค.').replace('Jun', 'มิ.ย.').replace('Jul', 'ก.ค.').replace('Aug', 'ส.ค.').replace('Sep', 'ก.ย.').replace('Oct', 'ต.ค.').replace('Nov', 'พ.ย.').replace('Dec', 'ธ.ค.')
    
    post = f"""เช็คดวงกันเถอะ ✨

{zodiac['symbol']} ราศี{zodiac['name']}
คนเกิด {zodiac['date_range']}

💕 ความรัก: {fortune['love']}
💼 การงาน: {fortune['career']}
🍀 เลขนำโชค: {fortune['lucky']}

━━━━━━━━━━━━━━━━━━

⭐ ดวงวันนี้แม่นมาก ลองเช็คดูสิ!

ดูดวงฟรีทุกวัน
starvia.website

#Starvia #ดวงวันนี้ #ราศี{zodiac['name']}"""
    
    return post

def generate_couple_post():
    """Generate couple compatibility post."""
    theme = random.choice(COUPLE_THEMES)
    
    post = f"""💕 ดวงคู่วันนี้

{theme['title']}

{theme['hook']}

{theme['detail']}

💡 เคล็ดลับ: {theme['advice']}

━━━━━━━━━━━━━━━━━━

✨ เช็คความเข้ากันกับคนรักได้ที่

starvia.website

#Starvia #ดวงคู่ #ความเข้ากันได้"""
    
    return post

def generate_auspicious_post():
    """Generate auspicious timing post."""
    theme = random.choice(AUSPICIOUS_THEMES)
    
    post = f"""🕐 ฤกษ์ยามวันนี้

{theme['title']}

{theme['hook']}

{theme['detail']}

💡 เคล็ดลับ: {theme['advice']}

━━━━━━━━━━━━━━━━━━

✨ ดูฤกษ์ยามส่วนตัวได้ที่

starvia.website

#Starvia #ฤกษ์ยาม #ดวงวันนี้"""
    
    return post

def main():
    import argparse
    parser = argparse.ArgumentParser(description='STARVIA Content Calendar Generator')
    parser.add_argument('--day', choices=['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], 
                       help='Day of week (default: today)')
    parser.add_argument('--zodiac', choices=[z['name'] for z in ZODIAC_SIGNS],
                       help='Zodiac sign (default: auto-rotate)')
    parser.add_argument('--output', choices=['text', 'json'], default='text',
                       help='Output format')
    
    args = parser.parse_args()
    
    day_type = get_day_type(args.day)
    
    if day_type == 'daily':
        zodiac = None
        if args.zodiac:
            zodiac = next((z for z in ZODIAC_SIGNS if z['name'] == args.zodiac), None)
        post = generate_daily_fortune(zodiac)
    elif day_type == 'couple':
        post = generate_couple_post()
    elif day_type == 'auspicious':
        post = generate_auspicious_post()
    else:
        post = generate_daily_fortune()
    
    if args.output == 'json':
        print(json.dumps({
            'type': day_type,
            'post': post,
            'timestamp': datetime.now().isoformat()
        }, ensure_ascii=False, indent=2))
    else:
        print(post)

if __name__ == '__main__':
    main()
