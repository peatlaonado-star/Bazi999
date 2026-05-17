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
    title: 'กระจกกรรม · Karma Mirror',
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
