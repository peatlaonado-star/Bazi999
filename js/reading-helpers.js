// Shared reading helpers for STARVIA renderers.
// Loaded after data/thai-astrology-content.js and before astro-renderers.js.
function escapeHTML(value){
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var FALLBACK_KARMA_MIRROR = {
  intro: 'กระจกกรรมไม่ใช่คำตัดสิน แต่คือรูปแบบที่ชีวิตมักพาคุณกลับมาเรียนรู้ซ้ำ เพื่อให้คุณเลือกทางใหม่ได้ชัดขึ้น',
  elements: {
    'ไฟ': { pattern: 'พลังใจร้อนและการเร่งตัดสินใจ', lesson: 'ใช้ความกล้าอย่างมีสติ', action: 'หยุด 3 ลมหายใจก่อนตัดสินใจเรื่องสำคัญ', ritual: 'ตั้งเจตนาว่าใช้พลังเพื่อสร้าง ไม่ใช่เพื่อเอาชนะ' }
  },
  weekdayShadows: ['เงาของวันเกิดคือรูปแบบเดิมที่รอให้คุณมองเห็นและเลือกต่างจากเดิม']
};

function buildKarmaMirror(p, dayOfWeek){
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var km = content && content.karmaMirror ? content.karmaMirror : FALLBACK_KARMA_MIRROR;
  var elements = km.elements || FALLBACK_KARMA_MIRROR.elements;
  var weekdayShadows = km.weekdayShadows || FALLBACK_KARMA_MIRROR.weekdayShadows;
  var elementKey = p && p.el ? p.el : 'ไฟ';
  var element = elements[elementKey] || elements['ไฟ'] || FALLBACK_KARMA_MIRROR.elements['ไฟ'];
  var shadow = weekdayShadows[dayOfWeek] || weekdayShadows[0] || FALLBACK_KARMA_MIRROR.weekdayShadows[0];

  return {
    title: 'กระจกกรรม',
    intro: km.intro || FALLBACK_KARMA_MIRROR.intro,
    pattern: element.pattern,
    lesson: element.lesson,
    weekdayShadow: shadow,
    action: element.action,
    ritual: element.ritual
  };
}

var FALLBACK_COUPLE_DHARMA = {
  intro: 'ดวงคู่คือแผนที่ความสัมพันธ์ที่ช่วยให้เห็นบทเรียนและวิธีดูแลกันให้ดีขึ้น',
  pairTypes: {
    supportive: { label: 'คู่เกื้อหนุน', title: 'คู่ที่ช่วยกันยกระดับชีวิต', meaning: 'มีพลังส่งเสริมกันและกัน', advice: 'วางเป้าหมายร่วมกัน' },
    mirror: { label: 'คู่กระจกใจ', title: 'คู่ที่สะท้อนเงาในใจ', meaning: 'สะท้อนบทเรียนและแผลเดิมของกันและกัน', advice: 'คุยกันด้วยความซื่อสัตย์' },
    fire: { label: 'คู่รักแรง', title: 'คู่ที่มีแรงดึงดูดสูง', meaning: 'เคมีแรงและปะทะง่าย', advice: 'พักก่อนคุยเมื่ออารมณ์ร้อน' },
    lesson: { label: 'คู่บทเรียน', title: 'คู่ที่มาเปิดบทเรียนสำคัญ', meaning: 'ความสัมพันธ์นี้สอนเรื่องขอบเขตและคุณค่า', advice: 'ทำข้อตกลงที่ปลอดภัย' },
    builder: { label: 'คู่สร้างฐาน', title: 'คู่ที่ค่อย ๆ สร้างชีวิตด้วยกัน', meaning: 'สร้างความมั่นคงระยะยาวได้ดี', advice: 'ดูแลแผนชีวิตและหน้าที่ร่วมกัน' }
  }
};

function getCoupleDharmaType(total, elS, sameElement){
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var dharma = content && content.coupleDharma ? content.coupleDharma : FALLBACK_COUPLE_DHARMA;
  var pairTypes = dharma.pairTypes || FALLBACK_COUPLE_DHARMA.pairTypes;
  var key;

  if (total >= 90 || (total >= 86 && elS >= 82)) {
    key = 'supportive';
  } else if (sameElement && total >= 65) {
    key = 'mirror';
  } else if (elS >= 88 && total >= 65) {
    key = 'fire';
  } else if (total < 60 || elS < 55) {
    key = 'lesson';
  } else {
    key = 'builder';
  }

  var selected = pairTypes[key] || pairTypes.builder || FALLBACK_COUPLE_DHARMA.pairTypes.builder;
  return {
    key: key,
    label: selected.label,
    title: selected.title,
    meaning: selected.meaning,
    advice: selected.advice,
    intro: dharma.intro || FALLBACK_COUPLE_DHARMA.intro
  };
}

var FALLBACK_LIFE_DOMAIN_FORECAST = {
  domains: [
    { key: 'luck', label: 'โชค', subtitle: 'จังหวะโอกาส', icon: '✦' },
    { key: 'money', label: 'การเงิน', subtitle: 'ทรัพย์สิน', icon: '💰' },
    { key: 'health', label: 'สุขภาพ', subtitle: 'พลังชีวิต', icon: '🫀' },
    { key: 'relationship', label: 'ความสัมพันธ์', subtitle: 'คู่ครอง / ครอบครัว', icon: '♡' },
    { key: 'career', label: 'การงาน', subtitle: 'ชื่อเสียง / ความก้าวหน้า', icon: '◈' },
    { key: 'supporters', label: 'บริวาร', subtitle: 'ทีม / ผู้สนับสนุน', icon: '♟' }
  ],
  domainThemes: {
    luck: { current: 'จังหวะโชคลอยและลาภลอยกำลังเปิดจากโอกาสเล็ก ๆ ที่ต้องใช้สติ', warning: 'อย่าเสี่ยงเกินงบหรือหวังผลเร็ว', remedy: 'ตั้งงบเสี่ยงโชคที่เสียได้จริง แล้วใช้สี/เลขเสริมดวงเป็นตัวช่วยเล็ก ๆ' }
  },
  elementGuidance: {
    'ไฟ': { tone: 'พลังไฟเปิดทางผ่านความกล้า', warning: 'ระวังใจร้อน', remedy: 'หยุด 3 ลมหายใจก่อนตัดสินใจ' }
  },
  ageBandOpportunities: {}
};

function formatDomainAgeRange(band){
  if (!band) return 'ช่วงอายุถัดไป';
  if (band.to >= 120) return band.from + ' ปีขึ้นไป';
  return band.from + '–' + band.to + ' ปี';
}

function buildLifeDomainMatrix(p, r, l, currentBand, nextBands){
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var cfg = content && content.lifeDomainForecast ? content.lifeDomainForecast : FALLBACK_LIFE_DOMAIN_FORECAST;
  var domains = cfg.domains || FALLBACK_LIFE_DOMAIN_FORECAST.domains;
  var themes = cfg.domainThemes || FALLBACK_LIFE_DOMAIN_FORECAST.domainThemes;
  var ageOps = cfg.ageBandOpportunities || {};
  var elementKey = p && p.el ? p.el : 'ไฟ';
  var element = (cfg.elementGuidance && (cfg.elementGuidance[elementKey] || cfg.elementGuidance['ไฟ'])) || FALLBACK_LIFE_DOMAIN_FORECAST.elementGuidance['ไฟ'];
  var activeBand = currentBand || { key: 'build', from: 29, to: 35, title: 'สร้างฐานมั่นคง' };
  var upcomingBands = (nextBands && nextBands.length ? nextBands : []).slice(0, 2);
  if (!upcomingBands.length) upcomingBands = [activeBand];

  return {
    title: 'แผนที่สถานการณ์ชีวิต',
    intro: 'อ่านสถานการณ์ปัจจุบัน วิธีเสริมให้ดีขึ้น และโอกาสที่จะเปิดตามช่วงอายุ โดยผสานธาตุชีวิต ดาวเจ้าชะตา ราศี ลัคนา และจังหวะวัยปัจจุบัน',
    elementSummary: element.tone,
    currentAgeRange: formatDomainAgeRange(activeBand),
    domains: domains.map(function(domain){
      var theme = themes[domain.key] || themes.luck || FALLBACK_LIFE_DOMAIN_FORECAST.domainThemes.luck;
      var opportunities = upcomingBands.map(function(band){
        var bandMap = ageOps[band.key] || {};
        return {
          ageRange: formatDomainAgeRange(band),
          title: band.title || 'ช่วงอายุถัดไป',
          text: bandMap[domain.key] || ('โอกาสด้าน' + domain.label + 'จะเปิดเมื่อใช้บทเรียนของช่วงวัยนี้ให้ถูกทาง')
        };
      });
      return {
        key: domain.key,
        label: domain.label,
        subtitle: domain.subtitle,
        icon: domain.icon || '✦',
        current: theme.current + ' · ตอนนี้อยู่ในช่วง ' + formatDomainAgeRange(activeBand) + ' (' + (activeBand.title || 'จังหวะชีวิตปัจจุบัน') + ') ' + element.tone,
        warning: theme.warning + ' · ' + element.warning,
        remedy: theme.remedy + ' · ' + element.remedy,
        opportunities: opportunities
      };
    })
  };
}

var THAI_MONTH_NAMES = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

var FALLBACK_MONTHLY_LIFE_MAP = {
  domains: [
    { key: 'career', label: 'การงาน', icon: '◈', teaser: 'เลือกงานหลักแล้วปิดให้เห็นผล' },
    { key: 'money', label: 'การเงิน', icon: '💰', teaser: 'วางระบบเงินให้ชัด' },
    { key: 'windfall', label: 'โชคลอย / ลาภลอย', icon: '🎲', teaser: 'ลาภลอยมาจากจังหวะสั้น ๆ แต่ต้องไม่เสี่ยงเกินงบ' },
    { key: 'relationship', label: 'ความรัก', icon: '♡', teaser: 'คุยด้วยความจริงใจและมีขอบเขต' },
    { key: 'health', label: 'สุขภาพ', icon: '🫀', teaser: 'พักให้พอและดูแล routine เล็ก ๆ' }
  ],
  elementGuidance: {
    'ไฟ': { focus: 'ลงมือเรื่องสำคัญ', warning: 'ระวังใจร้อน', action: 'เลือกเป้าหมายหลักหนึ่งเรื่อง' }
  },
  weeklyThemes: [
    { title: 'สัปดาห์ที่ 1 · ตั้งเจตนา', brief: 'ตั้งเป้าหมายเดือนนี้' },
    { title: 'สัปดาห์ที่ 2 · เร่งจังหวะ', brief: 'ลงมือกับงานหลัก' },
    { title: 'สัปดาห์ที่ 3 · ปรับสมดุล', brief: 'ทบทวนและปรับแผน' },
    { title: 'สัปดาห์ที่ 4 · เก็บเกี่ยว', brief: 'ปิดงานและสรุปบทเรียน' }
  ],
  rituals: ['เขียนเป้าหมายเดือนนี้','เคลียร์พื้นที่','เลือกสีมงคล','ขอบคุณผู้สนับสนุน','พักใจ','จดบทเรียน','ตั้งเจตนาเดือนถัดไป'],
  activityLabels: { career: 'งาน/โปรเจกต์', money: 'เงิน/ลงทุน', love: 'รัก/ความสัมพันธ์', rest: 'พัก/เคลียร์ใจ', caution: 'วันที่ควรระวัง' }
};

function getDaysInMonth(year, monthIndex){
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clampMonthlyScore(value){
  return Math.max(55, Math.min(99, value));
}

function buildMonthlyDayAdvice(tone, label){
  if (tone === 'caution') return 'วันนี้ควรชะลอเรื่องใหญ่ อ่านรายละเอียดซ้ำ และอย่ารีบตอบตกลงทันที';
  if (tone === 'career') return 'วันนี้ควรเลือกงานสำคัญ 1 เรื่อง แล้วทำให้มีความคืบหน้าชัดเจน';
  if (tone === 'money') return 'วันนี้ควรตรวจเงินเข้าออก แยกเงินจำเป็น และค่อยตัดสินใจเรื่องลงทุน';
  if (tone === 'love') return 'วันนี้ควรคุยด้วยน้ำเสียงนุ่มนวล ถามให้ชัด และอย่าเดาใจแทนกัน';
  if (tone === 'rest') return 'วันนี้ควรพักใจ เคลียร์พื้นที่เล็ก ๆ และอย่าฝืนใช้พลังเกินจำเป็น';
  return 'วันนี้ควรใช้จังหวะนี้กับ' + label + 'แบบค่อยเป็นค่อยไป';
}

function padLuckyNumber(value){
  var normalized = Math.abs(parseInt(value, 10) || 0) % 100;
  return normalized < 10 ? ('0' + normalized) : String(normalized);
}

function buildWindfallLuckGuide(p, birthDate, dayOfWeek){
  var birth = birthDate ? new Date(birthDate) : new Date();
  var bornDay = birth && !isNaN(birth.getTime()) ? birth.getDate() : 1;
  var bornMonth = birth && !isNaN(birth.getTime()) ? birth.getMonth() + 1 : 1;
  var planetIndex = p && typeof p.ei === 'number' ? p.ei : 0;
  var weekday = typeof dayOfWeek === 'number' ? dayOfWeek : (birth && !isNaN(birth.getTime()) ? birth.getDay() : 0);
  var elementKey = p && p.el ? p.el : 'ไฟ';
  var planetName = p && p.n ? p.n : 'ดาวเจ้าชะตา';
  var elementMap = {
    'ไฟ': { direction: 'ทิศตะวันออก', time: 'หลังพระอาทิตย์ขึ้นถึง 09:09 น.', omen: 'เลขจากไฟ แสง ป้ายสีแดง รถสีสว่าง หรือเลขที่เห็นตอนกำลังรีบ', offering: 'แสงไฟอุ่น ๆ หรือเทียนสีขาว 1 ดวง' },
    'ดิน': { direction: 'ทิศตะวันออกเฉียงเหนือ', time: 'ช่วง 08:08–10:10 น.', omen: 'เลขบ้าน ที่ดิน ใบเสร็จ ของหนัก ของเก่า หรือเลขที่เจอในที่ทำงาน', offering: 'เหรียญ 9 บาทหรือข้าวสารหยิบมือเล็ก ๆ' },
    'ลม': { direction: 'ทิศเหนือ', time: 'ช่วง 11:11–13:13 น.', omen: 'เลขจากแชต เบอร์โทร ป้ายรถ ข่าวบอกต่อ หรือเลขที่ได้ยินซ้ำสองครั้ง', offering: 'น้ำเปล่า 1 แก้วและการพูดดี 1 ประโยคก่อนออกจากบ้าน' },
    'น้ำ': { direction: 'ทิศตะวันตก', time: 'ช่วง 18:18–21:21 น.', omen: 'เลขจากความฝัน น้ำ ฝน กระจก เพลง หรือชื่อคนที่แวบเข้ามาในใจ', offering: 'น้ำสะอาด 1 แก้ว วางไว้ 9 นาทีแล้วอธิษฐานเงียบ ๆ' }
  };
  var profile = elementMap[elementKey] || elementMap['ไฟ'];
  var base = bornDay + (bornMonth * 3) + ((planetIndex + 1) * 7) + weekday;
  var luckyNumbers = [
    padLuckyNumber(base),
    padLuckyNumber((bornDay * 2) + bornMonth + planetIndex + 9),
    padLuckyNumber((base + bornDay + (weekday * 11)))
  ];

  return {
    title: 'สูตรเปิดดวงลาภลอย',
    subtitle: 'กิมมิกสายมูสำหรับหวย ลอตเตอรี่ และตัวเลขที่ควรลองแบบพอดีมือ',
    luckyNumbers: luckyNumbers,
    lotteryFocus: 'หวย / ลอตเตอรี่: ให้ลองจับคู่เลขชุดแรกกับเลขที่เจอซ้ำในชีวิตจริง อย่าซื้อเพราะโลภ ให้ซื้อเพราะเลขนั้นสะดุดใจแล้วใจนิ่ง',
    sacredTime: profile.time,
    direction: profile.direction,
    omen: profile.omen,
    ritualSteps: [
      'หันหน้าไปทาง' + profile.direction + ' วาง ' + profile.offering + ' แล้วตั้งนะโม 3 จบ',
      'เขียนเลข ' + luckyNumbers.join(' · ') + ' ลงกระดาษเล็ก ๆ พับเข้าหาตัว 3 ครั้ง แล้วพูดว่า “สาธุ ขอให้โชคที่เป็นของข้าพเจ้าเปิดทางมาอย่างปลอดภัย”',
      'ก่อนซื้อ ให้ตั้งงบก่อนเสี่ยง ห้ามเพิ่มเงินตามอารมณ์ ถ้าใจร้อนให้หยุดทันที ถือว่าเจ้าที่เจ้าทางเตือนแล้ว'
    ],
    mantra: 'โอม ศรีโชค ลาภะ มหาเฮง ' + planetName + ' เปิดทางทรัพย์ สาธุ',
    avoid: 'งดซื้อเพราะประชดชีวิต งดตามเลขคนอื่นทั้งชุด และงดทุ่มเงินเกินงบ เพราะดวงเฮงชอบคนใจนิ่ง ไม่ชอบคนใจร้อน'
  };
}

function buildMonthlyLifeMap(p, r, l, birthDate, today){
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var cfg = content && content.monthlyLifeMap ? content.monthlyLifeMap : FALLBACK_MONTHLY_LIFE_MAP;
  var now = today || new Date();
  var year = now.getFullYear();
  var monthIndex = now.getMonth();
  var monthName = THAI_MONTH_NAMES[monthIndex] || '';
  var buddhistYear = year + 543;
  var elementKey = p && p.el ? p.el : 'ไฟ';
  var guide = (cfg.elementGuidance && (cfg.elementGuidance[elementKey] || cfg.elementGuidance['ไฟ'])) || FALLBACK_MONTHLY_LIFE_MAP.elementGuidance['ไฟ'];
  var daysInMonth = getDaysInMonth(year, monthIndex);
  var bornDay = birthDate ? new Date(birthDate).getDate() : 1;
  if (!bornDay || isNaN(bornDay)) bornDay = 1;
  var planetIndex = p && typeof p.ei === 'number' ? p.ei : 0;
  var labels = cfg.activityLabels || FALLBACK_MONTHLY_LIFE_MAP.activityLabels;
  var calendarDays = [];
  var activityKeys = ['career', 'money', 'love', 'rest'];

  for (var d = 1; d <= daysInMonth; d++) {
    var seed = (d + bornDay + planetIndex + monthIndex) % 9;
    var key = activityKeys[(d + planetIndex + monthIndex) % activityKeys.length];
    var tone = seed === 0 || seed === 4 ? 'caution' : key;
    if (d % 10 === 0) tone = 'caution';
    calendarDays.push({
      day: d,
      tone: tone,
      label: labels[tone] || labels[key] || 'จังหวะชีวิต',
      text: tone === 'caution' ? 'ชะลอการตัดสินใจใหญ่และทบทวนข้อมูลให้ครบ' : 'เหมาะกับ' + (labels[key] || 'เรื่องสำคัญ'),
      simpleText: tone === 'caution'
        ? 'วันนี้เหมาะกับการทบทวน ไม่ควรรีบตัดสินใจเรื่องใหญ่'
        : 'วันนี้เหมาะกับ' + (labels[key] || 'เรื่องสำคัญ') + ' เพราะพลังเดือนนี้ช่วยให้เรื่องนี้เดินง่ายขึ้น',
      advice: buildMonthlyDayAdvice(tone, labels[key] || 'เรื่องสำคัญ')
    });
  }

  var freeDays = calendarDays.filter(function(day){ return day.tone !== 'caution'; }).slice(0, 3);
  if (freeDays.length < 3) freeDays = calendarDays.slice(0, 3);

  return {
    title: 'แผนที่ชีวิตรายเดือน STARVIA · ' + monthName + ' ' + buddhistYear,
    monthName: monthName,
    year: buddhistYear,
    elementFocus: guide.focus,
    elementWarning: guide.warning,
    elementAction: guide.action,
    domains: (cfg.domains || FALLBACK_MONTHLY_LIFE_MAP.domains).map(function(domain, index){
      var score = clampMonthlyScore(62 + ((planetIndex + 1) * 7 + (monthIndex + 1) * 3 + (index + 1) * 8) % 34);
      var actionMap = {
        career: 'ควรเลือกงานหลัก 1 เรื่อง ปิดให้จบก่อนเริ่มเรื่องใหม่ และจดสิ่งที่ต้องส่งมอบให้ชัด',
        money: 'ควรแยกเงินจำเป็น เงินสำรอง และเงินโอกาส แล้วหลีกเลี่ยงการใช้เงินตามอารมณ์',
        windfall: 'ควรกำหนดงบเสี่ยงโชคเล็ก ๆ ที่เสียได้จริง จดเลขหรือสัญญาณที่เจอซ้ำ แล้วหยุดทันทีเมื่อเกินวงเงิน',
        relationship: 'ควรพูดความต้องการให้ตรงแต่สุภาพ นัดคุยตอนใจนิ่ง และไม่เดาใจแทนกัน',
        health: 'ควรวางเวลานอน พักสายตา และทำ routine เล็ก ๆ ให้ต่อเนื่องอย่างน้อย 7 วัน'
      };
      return {
        key: domain.key,
        label: domain.label,
        icon: domain.icon || '✦',
        score: score,
        teaser: domain.teaser,
        forecast: domain.teaser + ' · ธาตุ' + elementKey + 'บอกให้เดือนนี้ ' + guide.action,
        action: actionMap[domain.key] || ('ควรตั้งเป้าเรื่อง' + domain.label + 'ให้ชัดและลงมือทีละขั้น'),
        goal: 'ตั้งเป้าเรื่อง' + domain.label + 'ให้ชัด 1 ข้อ แล้วเช็กความคืบหน้าทุกสัปดาห์'
      };
    }),
    calendarDays: calendarDays,
    freeDays: freeDays,
    weeklyBriefs: (cfg.weeklyThemes || FALLBACK_MONTHLY_LIFE_MAP.weeklyThemes).map(function(week, index){
      return {
        title: week.title,
        brief: week.brief + ' · โฟกัสส่วนตัว: ' + guide.focus,
        action: index === 0 ? 'ตั้งเป้า' : index === 1 ? 'ลงมือ' : index === 2 ? 'ปรับแผน' : 'สรุปผล'
      };
    }),
    rituals: (cfg.rituals || FALLBACK_MONTHLY_LIFE_MAP.rituals).slice(0, 7)
  };
}
