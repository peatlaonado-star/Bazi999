#!/usr/bin/env node
/**
 * Generate Cosmic Events for STARVIA Banner
 * 
 * Uses astronomy-engine to calculate:
 * - New Moon / Full Moon phases
 * - Planetary ingresses (planets entering zodiac signs)
 * - Solstices / Equinoxes
 * 
 * Output: data/cosmic-events-generated.js (browser) + data/cosmic-events-generated.json (reference)
 * 
 * Usage: node scripts/generate-cosmic-events.mjs
 */

import * as Astronomy from 'astronomy-engine';
import fs from 'fs';
import path from 'path';

// ─── Thai Zodiac Names ──────────────────────────────────────────

const ZODIAC_TH = [
  { name: 'เมษ', en: 'Aries', emoji: '♈', element: 'fire' },
  { name: 'พฤษภ', en: 'Taurus', emoji: '♉', element: 'earth' },
  { name: 'มิถุน', en: 'Gemini', emoji: '♊', element: 'air' },
  { name: 'กรกฎ', en: 'Cancer', emoji: '♋', element: 'water' },
  { name: 'สิงห์', en: 'Leo', emoji: '♌', element: 'fire' },
  { name: 'กันย์', en: 'Virgo', emoji: '♍', element: 'earth' },
  { name: 'ตุลย์', en: 'Libra', emoji: '♎', element: 'air' },
  { name: 'พิจิก', en: 'Scorpio', emoji: '♏', element: 'water' },
  { name: 'ธนู', en: 'Sagittarius', emoji: '♐', element: 'fire' },
  { name: 'มกร', en: 'Capricorn', emoji: '♑', element: 'earth' },
  { name: 'กุมภ์', en: 'Aquarius', emoji: '♒', element: 'air' },
  { name: 'มีน', en: 'Pisces', emoji: '♓', element: 'water' },
];

// ─── Planet Config ──────────────────────────────────────────────

const PLANETS = [
  { body: 'Venus', name: 'ศุกร์', en: 'Venus', emoji: '♀️' },
  { body: 'Mars', name: 'อังคาร', en: 'Mars', emoji: '♂️' },
  { body: 'Jupiter', name: 'พฤหัส', en: 'Jupiter', emoji: '♃' },
  { body: 'Saturn', name: 'เสาร์', en: 'Saturn', emoji: '♄' },
];

// ─── Helper Functions ───────────────────────────────────────────

/** Get zodiac sign from ecliptic longitude (0-360°) */
function getZodiacSign(longitude) {
  const index = Math.floor(longitude / 30) % 12;
  return ZODIAC_TH[index];
}

/** Get geocentric ecliptic longitude for any body */
function getEclipticLongitude(body, date) {
  if (body === 'Sun') {
    // Use SunPosition for the Sun (geocentric)
    const pos = Astronomy.SunPosition(date);
    return pos.elon;
  }
  if (body === 'Moon') {
    // Use EclipticGeoMoon for the Moon (geocentric)
    const pos = Astronomy.EclipticGeoMoon(date);
    return pos.lon * Astronomy.RAD2DEG;
  }
  // For planets: GeoVector + Ecliptic conversion
  const vec = Astronomy.GeoVector(body, date, false);
  const ecl = Astronomy.Ecliptic(vec);
  return ecl.elon;
}

/** Format date as YYYY-MM-DD */
function toISO(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Get Thai month name */
function getThaiMonth(date) {
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return months[new Date(date).getMonth()];
}

/** Get Thai year (Buddhist era) */
function getThaiYear(date) {
  return new Date(date).getFullYear() + 543;
}

/** Format date for display: "15 ม.ค. 2569" */
function formatThaiDate(date) {
  const d = new Date(date);
  return `${d.getDate()} ${getThaiMonth(date)} ${getThaiYear(date)}`;
}

/** Get element emoji */
function getElementEmoji(element) {
  const emojis = { fire: '🔥', earth: '🌍', air: '💨', water: '💧' };
  return emojis[element] || '✨';
}

// ─── Generate Moon Phases ───────────────────────────────────────

function generateMoonPhases(startDate, months) {
  const events = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  
  let mq = Astronomy.SearchMoonQuarter(startDate);
  
  while (mq && mq.time && mq.time.date < endDate) {
    const date = toISO(mq.time.date);
    const moonLon = getEclipticLongitude('Moon', mq.time);
    const zodiac = getZodiacSign(moonLon);
    
    let title, subtitle, emoji;
    
    switch (mq.quarter) {
      case 0: // New Moon
        title = `New Moon ในราศี${zodiac.name}`;
        subtitle = `พลังเริ่มต้นใหม่ — เหมาะกับการตั้งเป้าหมายและเริ่มโปรเจกต์`;
        emoji = '🌑';
        break;
      case 1: // First Quarter
        title = `Quarter Moon ในราศี${zodiac.name}`;
        subtitle = `พลังตัดสินใจ — ถึงเวลาลงมือทำสิ่งที่เริ่มไว้`;
        emoji = '🌓';
        break;
      case 2: // Full Moon
        title = `Full Moon ในราศี${zodiac.name}`;
        subtitle = `พลังถึงขีดสุด! เก็บเกี่ยวผลและปล่อยวางสิ่งที่ไม่จำเป็น`;
        emoji = '🌕';
        break;
      case 3: // Last Quarter
        title = `Last Quarter ในราศี${zodiac.name}`;
        subtitle = `พลังทบทวน — สะสางสิ่งค้างคาและเตรียมตัวเริ่มใหม่`;
        emoji = '🌘';
        break;
    }
    
    // Determine element for subtitle
    const elementEmoji = getElementEmoji(zodiac.element);
    
    events.push({
      start: date,
      end: date,
      emoji: emoji,
      title: title,
      subtitle: `${elementEmoji} ${subtitle}`,
      type: 'moon_phase',
      zodiac: zodiac.name,
      phase: ['new', 'first_quarter', 'full', 'last_quarter'][mq.quarter],
    });
    
    try {
      mq = Astronomy.NextMoonQuarter(mq);
    } catch (e) {
      break;
    }
  }
  
  return events;
}

// ─── Generate Planetary Ingresses ───────────────────────────────

function generatePlanetaryIngresses(startDate, months) {
  const events = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  
  for (const planet of PLANETS) {
    let prevLon = getEclipticLongitude(planet.body, startDate);
    let prevZodiac = getZodiacSign(prevLon);
    
    // Check every day
    const checkDate = new Date(startDate);
    while (checkDate < endDate) {
      const lon = getEclipticLongitude(planet.body, checkDate);
      const zodiac = getZodiacSign(lon);
      
      // Check if zodiac changed
      if (zodiac.name !== prevZodiac.name) {
        const date = toISO(checkDate);
        
        events.push({
          start: date,
          end: date,
          emoji: planet.emoji,
          title: `${planet.en} เข้าราศี${zodiac.name}`,
          subtitle: `พลัง${planet.name}เคลื่อนเข้าสู่${getElementEmoji(zodiac.element)} ราศี${zodiac.name} — สังเกตการเปลี่ยนแปลงในชีวิต`,
          type: 'ingress',
          planet: planet.en,
          zodiac: zodiac.name,
        });
        
        prevZodiac = zodiac;
      }
      
      prevLon = lon;
      checkDate.setDate(checkDate.getDate() + 1);
    }
  }
  
  return events;
}

// ─── Generate Seasons ───────────────────────────────────────────

function generateSeasons(year) {
  const events = [];
  const seasons = Astronomy.Seasons(year);
  
  const seasonNames = [
    { name: 'Vernal Equinox', th: 'วันเริ่มฤดูใบไม้ผลิ', emoji: '🌸', subtitle: 'กลางวันเท่ากลางคืน — จุดเริ่มต้นใหม่ของธรรมชาติ' },
    { name: 'Summer Solstice', th: 'วันเริ่มฤดูร้อน', emoji: '☀️', subtitle: 'กลางวันยาวที่สุด — พลังงานสูงสุด ลงมือทำสิ่งใหญ่' },
    { name: 'Autumnal Equinox', th: 'วันเริ่มฤดูใบไม้ร่วง', emoji: '🍂', subtitle: 'กลางวันเท่ากลางคืน — จุดสมดุล ทบทวนและเก็บเกี่ยว' },
    { name: 'Winter Solstice', th: 'วันเริ่มฤดูหนาว', emoji: '❄️', subtitle: 'กลางคืนยาวที่สุด — พลังเงียบสงบ เตรียมพร้อมปีใหม่' },
  ];
  
  const seasonDates = [
    seasons.mar_equinox,
    seasons.jun_solstice,
    seasons.sep_equinox,
    seasons.dec_solstice,
  ];
  
  for (let i = 0; i < 4; i++) {
    const date = toISO(seasonDates[i].date);
    const info = seasonNames[i];
    
    events.push({
      start: date,
      end: date,
      emoji: info.emoji,
      title: info.th,
      subtitle: info.subtitle,
      type: 'season',
      season: info.name,
    });
  }
  
  return events;
}

// ─── Main ───────────────────────────────────────────────────────

function generate() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  console.log(`🗓️  Generating cosmic events from ${toISO(startDate)}...`);
  
  // Generate 14 months of events (to have buffer)
  const moonPhases = generateMoonPhases(startDate, 14);
  console.log(`🌑 Found ${moonPhases.length} moon phases`);
  
  const ingresses = generatePlanetaryIngresses(startDate, 14);
  console.log(`🪐 Found ${ingresses.length} planetary ingresses`);
  
  const seasons2026 = generateSeasons(now.getFullYear());
  const seasons2027 = generateSeasons(now.getFullYear() + 1);
  const seasons = [...seasons2026, ...seasons2027];
  console.log(`🌸 Found ${seasons.length} seasonal events`);
  
  // Merge all events
  const allEvents = [...moonPhases, ...ingresses, ...seasons];
  
  // Sort by date
  allEvents.sort((a, b) => a.start.localeCompare(b.start));
  
  // Remove duplicates (same date + type)
  const seen = new Set();
  const uniqueEvents = allEvents.filter(e => {
    const key = `${e.start}|${e.type}|${e.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  console.log(`✅ Total unique events: ${uniqueEvents.length}`);
  
  // Output
  const output = {
    generated: toISO(new Date()),
    events: uniqueEvents,
  };
  
  // Write JSON (reference)
  const jsonPath = path.join(process.cwd(), 'data', 'cosmic-events-generated.json');
  const dir = path.dirname(jsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`💾 Written JSON to ${jsonPath}`);
  
  // Write JS (browser)
  const jsPath = path.join(process.cwd(), 'data', 'cosmic-events-generated.js');
  const jsContent = `/**\n * Auto-generated cosmic events from astronomy-engine\n * Generated: ${output.generated}\n * DO NOT EDIT MANUALLY — run: node scripts/generate-cosmic-events.mjs\n */\n\nvar GENERATED_EVENTS = [\n${uniqueEvents.map(e => {
    const parts = Object.entries(e).map(([k, v]) => {
      if (typeof v === 'string') return `${k}: '${v.replace(/'/g, "\\'")}'`;
      return `${k}: ${JSON.stringify(v)}`;
    }).join(', ');
    return '    {' + parts + '}';
  }).join(',\n')}\n];\n`;
  fs.writeFileSync(jsPath, jsContent);
  console.log(`💾 Written JS to ${jsPath}`);
  
  // Also print summary
  console.log('\n📅 Upcoming events:');
  for (const e of uniqueEvents.slice(0, 15)) {
    console.log(`  ${e.start} ${e.emoji} ${e.title}`);
  }
  
  return output;
}

generate();
