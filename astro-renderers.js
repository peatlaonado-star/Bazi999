// Renderers extracted from app.js
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

function buildDailyBrief(p, dayOfWeek, personalColor) {
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var db = content && content.dailyBrief ? content.dailyBrief : null;
  if (!db) {
    db = {
      weekdayEnergy: ['พลังงานวันนี้: มีพลังงานดีสำหรับการเริ่มต้นใหม่'],
      weekdayFocus: ['โฟกัส: สิ่งที่สำคัญที่สุดวันนี้'],
      weekdayWarning: ['ระวัง: อย่ารีบตัดสินใจ'],
      weekdayAction: ['สิ่งที่ควรทำวันนี้: หยุดพักสักครู่']
    };
  }
  var energy = db.weekdayEnergy[dayOfWeek] || db.weekdayEnergy[0];
  var focus = db.weekdayFocus[dayOfWeek] || db.weekdayFocus[0];
  var warning = db.weekdayWarning[dayOfWeek] || db.weekdayWarning[0];
  var action = db.weekdayAction[dayOfWeek] || db.weekdayAction[0];
  var colorName = personalColor ? personalColor.name : '';
  var colorHex = personalColor ? personalColor.hex : '#C9A227';
  return { energy: energy, colorName: colorName, colorHex: colorHex, focus: focus, warning: warning, action: action };
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

// ===== MODE 0: Individual =====
function go0(){
  var ds=document.getElementById('d0').value; if(!ds)return;
  var u=U(), PL2=getPL(), RA2=getRA();
  var nm=document.getElementById('n0').value||(u.pdef||'บุคคลนี้');
  var gd=document.getElementById('g0').value;
  var ts=document.getElementById('t0').value||'06:00';
  var p=PL2[new Date(ds).getDay()];
  var ri=getRasi(ds), li=getLagna(ds,ts);
  var r=RA2[ri], l=RA2[li];
  document.getElementById('fc0').style.display='none';
  showLoad();
  
  // 💡 กลยุทธ์ Illusion of Labor (เปลี่ยนข้อความบิ้วด์อารมณ์)
  var loadTxt = document.getElementById('load-txt');
  loadTxt.innerHTML = '✨ กำลังคำนวณตำแหน่งดวงดาว...';
  
  setTimeout(function(){ loadTxt.innerHTML = '🔮 กำลังถอดรหัสราศีและลัคนา...'; }, 1000);
  setTimeout(function(){ loadTxt.innerHTML = '📜 กำลังสร้างพิมพ์เขียวชีวิตของคุณ...'; }, 2000);

  // ยืดเวลาโหลดเป็น 3 วินาทีเพื่อให้ลูกค้ารู้สึกว่าระบบทำงานลึกซึ้งจริงๆ
  setTimeout(function(){ 
    hideLoad(); 
    loadTxt.innerHTML = u.ld; // คืนค่าเดิม
    renderInd(nm,gd,ds,ts,p,r,l,ri,li,u); 
  }, 3200);
}

var LIFE_BANDS = [
  {from:0,to:7,key:'root',title:'รากฐานความปลอดภัย',life:'วัยนี้ชีวิตผูกกับบ้าน ความอบอุ่น และการอ่านอารมณ์ของคนรอบตัว',survive:'ผ่านมาได้ด้วยการสังเกต เรียนรู้จากผู้ใหญ่ และหาจุดที่ตัวเองรู้สึกปลอดภัย',unlock:'ถ้ายังไม่ค่อยมั่นคงทางใจ ให้ฝึกบอกความต้องการของตัวเองและสร้างพื้นที่สงบ',prep:'ฝึกพักใจ ไม่แบกอารมณ์คนอื่น และเชื่อว่าคุณสมควรได้รับความรักแบบปลอดภัย'},
  {from:8,to:14,key:'learn',title:'เริ่มรู้จักตัวเอง',life:'เริ่มเปรียบเทียบตัวเองกับคนอื่น และเริ่มถามว่า “ฉันเป็นใคร”',survive:'ผ่านมาได้ด้วยการเรียนรู้เร็ว มีครู เพื่อน หรือหนังสือเป็นตัวช่วย',unlock:'ถ้ายังไม่มั่นใจในคุณค่า ให้ลดการเปรียบเทียบและจดสิ่งที่ทำได้จริง',prep:'ฝึกพื้นฐานวินัยและทักษะที่ใช้ได้จริง เพื่อให้ความมั่นใจมาจากผลงาน'},
  {from:15,to:21,key:'identity',title:'ทดสอบตัวตน',life:'วัยนี้เต็มไปด้วยการทดลองเส้นทาง ความรักแรก และแรงกดดันเรื่องอนาคต',survive:'ผ่านมาได้ด้วยความกล้าเริ่มใหม่และยอมรับว่าตัวเองยังไม่ต้องรู้ทุกอย่าง',unlock:'ถ้ายังติดความกลัวผิด ให้ฝึกตัดสินใจจากข้อมูลจริงมากกว่าความรู้สึกชั่ววูบ',prep:'หาความถนัดให้เจอจากการลองหลายแบบ แล้วเริ่มเลือกทางที่ใช่'},
  {from:22,to:28,key:'launch',title:'ตั้งหลักชีวิต',life:'เป็นช่วงตั้งหลักเรื่องงาน เงิน และสถานะในชีวิต',survive:'ผ่านมาได้ด้วยการลงมือทำให้เป็นรูปธรรม และหาคนช่วยงานที่ไว้ใจได้',unlock:'ถ้ายังสวิงง่าย ให้ฝึกวางแผนและจัดลำดับความสำคัญ',prep:'เตรียมรับความรับผิดชอบที่ใหญ่ขึ้น ทั้งหน้าที่การงานและความสัมพันธ์จริงจัง'},
  {from:29,to:35,key:'build',title:'สร้างฐานมั่นคง',life:'เป็นช่วงสร้างฐานให้แน่น งาน เงิน บ้าน และขอบเขตชีวิตเริ่มชัด',survive:'ผ่านมาได้ด้วยความสม่ำเสมอและความอดทนต่อแรงกดดัน',unlock:'ถ้ายังเหนื่อยกับการแบกทุกอย่าง ให้ฝึกขอความช่วยเหลือและแบ่งงาน',prep:'เตรียมเจอการตัดสินใจใหญ่เกี่ยวกับทรัพย์สิน ครอบครัว และทิศทางชีวิต'},
  {from:36,to:42,key:'lead',title:'รับบทผู้นำ',life:'ชีวิตเริ่มให้คุณรับบทผู้นำ ดูแลคนอื่น และตัดสินใจแทนหลายอย่าง',survive:'ผ่านมาได้ด้วยการยอมเป็นเจ้าของผลลัพธ์ ไม่หนีปัญหา',unlock:'ถ้ายังเผลอใช้แต่พลังตัวเอง ให้ฝึกไว้ใจคนอื่นและมอบหมายงาน',prep:'เตรียมรับบทที่ต้องมีวุฒิภาวะสูงขึ้น ทั้งในงานและบ้าน'},
  {from:43,to:50,key:'expand',title:'ขยายอิทธิพล',life:'เป็นช่วงขยายอิทธิพล ผลงาน และฐานะ ให้สิ่งที่ทำเริ่มออกผลกว้าง',survive:'ผ่านมาได้ด้วยการมองภาพใหญ่และเลือกสิ่งที่คุ้มค่าจริงๆ',unlock:'ถ้ายังไหลไปตามแรงกระเพื่อมภายนอก ให้ฝึกโฟกัสเรื่องหลักเพียงไม่กี่เรื่อง',prep:'เตรียมเจอความรับผิดชอบที่มากขึ้น พร้อมโอกาสเลื่อนขั้นหรือขยายกิจการ'},
  {from:51,to:60,key:'mentor',title:'ส่งต่อประสบการณ์',life:'ช่วงนี้คุณเริ่มเป็นคนส่งต่อประสบการณ์มากกว่าไล่ล่าพิสูจน์ตัวเอง',survive:'ผ่านมาได้ด้วยความนิ่ง ความเชื่อมั่น และการแบ่งปันความรู้',unlock:'ถ้ายังไม่ยอมปล่อยมือ ให้ฝึกเป็นโค้ชแทนการคุมทุกอย่าง',prep:'เตรียมวางระบบให้สิ่งที่สร้างไว้ทำงานต่อได้เอง'},
  {from:61,to:120,key:'legacy',title:'วางมรดกชีวิต',life:'ช่วงชีวิตเน้นคุณภาพใจ ความสงบ และการส่งต่อสิ่งสำคัญ',survive:'ผ่านมาได้ด้วยการยอมรับสิ่งที่เปลี่ยนไม่ได้ และรักษาสิ่งที่มีคุณค่า',unlock:'ถ้ายังยึดติดกับบทเดิม ให้ฝึกปล่อยวางและใช้ชีวิตให้เบาขึ้น',prep:'เตรียมจัดการมรดกชีวิต ทั้งความรู้ ทรัพย์สิน และเรื่องที่อยากส่งต่อ'}
];

var LIFE_ELEMENT_GUIDE = {
  'ไฟ': {root:'รอดด้วยความกล้า แต่ต้องฝึกหยุดก่อนตัดสินใจ', learn:'อย่าปล่อยให้ไฟในหัวเผาใจตัวเอง', identity:'ใช้พลังเริ่มต้นสิ่งใหม่อย่างมีสติ', launch:'วางแผนก่อนพุ่ง', build:'คุมอีโก้และแบ่งหน้าที่ให้เป็น', lead:'ใช้บารมีสร้างทีม ไม่ใช่คุมทุกอย่าง', expand:'พลังของคุณจะพาไปไกลเมื่อโฟกัสเป็น', mentor:'ส่งต่อไฟให้คนอื่นโดยไม่เผาตัวเอง', legacy:'ปล่อยให้แสงของคุณเป็นแรงบันดาลใจ'},
  'ดิน': {root:'รอดด้วยความอดทนและการมีฐานที่มั่นคง', learn:'เชื่อในผลงานเล็กๆ ที่ทำซ้ำได้', identity:'ยอมให้ชีวิตไม่ต้องเป๊ะเสมอ', launch:'สร้างระบบก่อนค่อยขยาย', build:'ความมั่นคงมาเมื่อคุณยืดหยุ่น', lead:'เป็นเสาหลัก แต่ไม่ต้องแบกคนเดียว', expand:'เลือกทางที่คุ้มค่าจริงๆ', mentor:'สอนคนอื่นด้วยวิธีที่ทำได้จริง', legacy:'เก็บรักษาคุณค่าที่สร้างไว้ให้ดี'},
  'ลม': {root:'รอดด้วยไหวพริบและการสื่อสาร', learn:'หาคำตอบจากการเรียนรู้และลงมือเขียนลงแผน', identity:'ลองหลายทางได้ แต่ต้องฟังเสียงตัวเอง', launch:'ปิดจบสิ่งสำคัญให้เป็น', build:'โฟกัสลึกกว่าเดิม แล้วผลจะมา', lead:'ใช้คำพูดสร้างแรงบันดาลใจ', expand:'ความคิดจะกลายเป็นเงินเมื่อคุณเลือกเรื่องหลัก', mentor:'ส่งต่อความรู้แบบเป็นระบบ', legacy:'ทิ้งระบบความคิดที่ชัดเจนไว้ให้คนรุ่นหลัง'},
  'น้ำ': {root:'รอดด้วยความรู้สึกไวและการอ่านบรรยากาศ', learn:'ฟังหัวใจตัวเองก่อนจะฟังคนอื่นมากเกินไป', identity:'อย่าให้ความกลัวถูกปฏิเสธคุมชีวิต', launch:'ตั้งขอบเขตเวลาทำงานและความสัมพันธ์', build:'แยกอารมณ์ออกจากภาระ', lead:'เป็นผู้นำที่ปลอดภัย ไม่ใช่ผู้แบกรับทุกอย่าง', expand:'ความเมตตาเป็นพลัง เมื่อคุณไม่ทิ้งตัวเอง', mentor:'สอนคนอื่นเรื่องการดูแลใจ', legacy:'ทิ้งความอบอุ่นและความเข้าใจไว้เป็นมรดก'}
};

function fmtAgeRange(b){
  return b.to >= 120 ? (b.from + ' ปีขึ้นไป') : (b.from + '–' + b.to + ' ปี');
}

function getLifeBandIndex(ageY){
  for (var i = 0; i < LIFE_BANDS.length; i++) {
    if (ageY >= LIFE_BANDS[i].from && ageY <= LIFE_BANDS[i].to) return i;
  }
  return LIFE_BANDS.length - 1;
}

function buildLifeTimeline(kind, p, ageY, ageM){
  var idx = getLifeBandIndex(ageY);
  var bands;
  var heading;
  var lead;

  if (kind === 'past') {
    bands = LIFE_BANDS.slice(Math.max(0, idx - 2), idx);
    if (!bands.length) bands = [LIFE_BANDS[0]];
    heading = 'อดีต · สิ่งที่หล่อหลอมคุณ';
    lead = 'ช่วงวัยก่อนหน้าที่อธิบายว่าคุณผ่านชีวิตมาได้อย่างไร และอะไรกลายเป็นรากนิสัยในวันนี้';
  } else if (kind === 'present') {
    bands = [LIFE_BANDS[idx]];
    heading = 'ปัจจุบัน · สิ่งที่ชีวิตกำลังทดสอบ';
    lead = 'ช่วงวัยที่กำลังบอกว่าตอนนี้ชีวิตต้องการให้คุณปรับอะไร เพื่อไม่ให้วนกลับไปเจอปัญหาเดิม';
  } else {
    bands = LIFE_BANDS.slice(idx + 1, idx + 3);
    if (!bands.length) bands = [LIFE_BANDS[LIFE_BANDS.length - 1]];
    heading = 'อนาคต · สิ่งที่ควรเตรียมรับมือ';
    lead = 'ช่วงวัยถัดไปที่กำลังรอคุณอยู่ พร้อมสิ่งที่ควรฝึกไว้ล่วงหน้าเพื่อให้รับมือได้มั่นคงกว่าเดิม';
  }

  var elGuide = LIFE_ELEMENT_GUIDE[p.el] || LIFE_ELEMENT_GUIDE['ไฟ'];
  var html = '<div style="font-size:14px; line-height:1.9; color:var(--tx); margin-bottom:12px;">'
    + '<strong class="hl-gold">✦ ' + heading + ' ✦</strong><br>' + lead + '<br>'
    + '<span style="color:var(--tx2); font-size:12px;">อายุปัจจุบัน: ' + ageY + ' ปี ' + ageM + ' เดือน · ธาตุ' + p.el + '</span>'
    + '</div>';

  bands.forEach(function(b){
    html += '<div style="margin-bottom:14px; padding:14px 15px; border-radius:14px; border:1px solid rgba(201,162,39,.16); border-left:4px solid ' + p.c + '; background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));">'
      + '<div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:10px;">'
      + '<div style="font-size:12px; letter-spacing:.08em; color:#C9A227; font-weight:700;">' + fmtAgeRange(b) + '</div>'
      + '<div style="font-size:13px; color:#fff; font-weight:700;">' + b.title + '</div>'
      + '</div>'
      + '<div style="font-size:13px; line-height:1.85; color:var(--tx); margin-bottom:8px;"><strong class="hl-gold">ชีวิตช่วงนี้:</strong> ' + b.life + '</div>'
      + '<div style="font-size:13px; line-height:1.85; color:var(--tx); margin-bottom:8px;"><strong class="hl-gold">ผ่านมาได้ด้วย:</strong> ' + b.survive + '</div>'
      + '<div style="font-size:13px; line-height:1.85; color:var(--tx); margin-bottom:8px;"><strong class="hl-gold">ถ้ายังไม่ปลดล็อก:</strong> ' + b.unlock + '</div>'
      + '<div style="font-size:13px; line-height:1.85; color:var(--tx);"><strong class="hl-gold">เตรียมตัว:</strong> ' + b.prep + '</div>'
      + '<div style="margin-top:10px; padding:10px 12px; border-radius:10px; background:rgba(0,0,0,.18); color:var(--tx2); font-size:12px; line-height:1.7;"><strong style="color:#C9A227;">กุญแจของธาตุ' + p.el + ':</strong> ' + elGuide[b.key] + '</div>'
      + '</div>';
  });

  return html;
}

function renderInd(nm,gd,ds,ts,p,r,l,ri,li,u){
  var wrap=document.getElementById('r0');
  nm = escapeHTML(nm);
  gd = escapeHTML(gd);
  ts = escapeHTML(ts);
  var td=escapeHTML(fmtDate(ds));
  var tDisp = ts ? (escapeHTML(u.ti)+' '+ts+escapeHTML(u.tu)) : '';
  var dayOfWeek = new Date(ds).getDay();
  
  // คำนวณอายุ (ปี และ เดือน)
  var today = new Date();
  var bday = new Date(ds);
  var ageY = today.getFullYear() - bday.getFullYear();
  var ageM = today.getMonth() - bday.getMonth();
  if (ageM < 0 || (ageM === 0 && today.getDate() < bday.getDate())) { ageY--; ageM += 12; }
  if (today.getDate() < bday.getDate()) { ageM--; if (ageM < 0) ageM = 11; }
  var ageTxt = (CL === 'th') ? ('อายุ ' + ageY + ' ปี ' + ageM + ' เดือน') : ('Age ' + ageY + ' yrs ' + ageM + ' mos');
  
  
  // 1. ทักษาปกรณ์ (Golden Trait / Shadow Self)
  var THAKSA = [
    { sri: 'ทักษะการสื่อสาร การใช้สติปัญญา และการเจรจาต่อรอง (พลังของดาวพุธ)', kala: 'การรักความสบายจนเกินพอดี หรือการยึดติดในวัตถุ (พลังเงาของดาวศุกร์)' }, // 0
    { sri: 'ความอดทน การมีวินัย และการวางแผนระยะยาวที่รอบคอบ (พลังของดาวเสาร์)', kala: 'อีโก้ ความใจร้อน และการอยากเป็นศูนย์กลาง (พลังเงาของดาวอาทิตย์)' }, // 1
    { sri: 'สติปัญญา ความเมตตา และการมองการณ์ไกล (พลังของดาวพฤหัสบดี)', kala: 'ความอ่อนไหวทางอารมณ์ และการจมอยู่กับอดีต (พลังเงาของดาวจันทร์)' }, // 2
    { sri: 'การพลิกแพลงสถานการณ์ การคิดนอกกรอบ และความกล้าเสี่ยง (พลังของราหู)', kala: 'ความโกรธที่ควบคุมไม่ได้ และการใช้อารมณ์ตัดสินปัญหา (พลังเงาของดาวอังคาร)' }, // 3
    { sri: 'ศิลปะ การสร้างความสัมพันธ์ และรสนิยมที่โดดเด่น (พลังของดาวศุกร์)', kala: 'ความวิตกกังวล การมองโลกในแง่ร้าย และการกดดันตัวเอง (พลังเงาของดาวเสาร์)' }, // 4
    { sri: 'สัญชาตญาณ ความเห็นอกเห็นใจ และการดูแลผู้อื่น (พลังของดาวจันทร์)', kala: 'ความลุ่มหลง ความเชื่อที่ผิด หรือการหลอกตัวเอง (พลังเงาของราหู)' }, // 5
    { sri: 'ความมุ่งมั่น พลังงานที่ล้นเหลือ และการกล้าลงมือทำ (พลังของดาวอังคาร)', kala: 'คำพูดที่ทำร้ายผู้อื่นโดยไม่ตั้งใจ และการคิดไวทำไวเกินไป (พลังเงาของดาวพุธ)' } // 6
  ];
  var tk = THAKSA[dayOfWeek];
  var thaksaHtml = '<strong class="hl-gold">✦ พรสวรรค์หนุนดวง (Golden Trait):</strong><br>'
    + 'จุดแข็งที่จะเป็นแม่เหล็กดึงดูดความสำเร็จและสิริมงคลเข้ามาในชีวิตคุณคือ <span class="hl-purple">' + tk.sri + '</span> ยิ่งคุณใช้สิ่งนี้มากเท่าไหร่ เส้นทางของคุณจะยิ่งราบรื่นขึ้น<br><br>'
    + '<strong class="hl-gold">✦ เงาในใจที่ต้องก้าวข้าม (Shadow Self):</strong><br>'
    + 'อุปสรรคที่แท้จริงไม่ได้มาจากภายนอก แต่มาจาก <span class="hl-purple">' + tk.kala + '</span> หากคุณรู้เท่าทันและปรับสมดุลจุดนี้ได้ ชีวิตคุณจะก้าวกระโดดอย่างมหาศาล';

  // 2. พิมพ์เขียวปรับฐานชีวิต (Action Plan)
  var elementInsight = ''; var elementAction = '';
  if (p.ei === 0) {
    elementInsight = 'พลังแห่งไฟ <span style="font-size:14px">🔥</span> ทำให้คุณมีแรงขับเคลื่อนมหาศาล แต่มักเผาผลาญพลังงานไปกับความใจร้อนหรือการพยายามควบคุมทุกอย่าง';
    elementAction = 'สร้าง <strong class="hl-gold">"พื้นที่ว่าง"</strong> <span style="font-size:14px">🧘</span> ระหว่างสิ่งเร้าและการตอบสนอง ฝึกหยุดคิดสัก 3 วินาทีก่อนพูดหรือตัดสินใจเสมอ';
  } else if (p.ei === 1) {
    elementInsight = 'พลังแห่งดิน <span style="font-size:14px">🌱</span> ทำให้คุณมั่นคงและรอบคอบ แต่ความกลัวความผิดพลาดมักทำให้คุณยึดติดและปฏิเสธความเปลี่ยนแปลง';
    elementAction = 'อนุญาตให้ตัวเองทำอะไรที่ <strong class="hl-gold">"ไม่สมบูรณ์แบบ"</strong> <span style="font-size:14px">🎨</span> บ้างสัปดาห์ละครั้ง เพื่อสอนจิตใต้สำนึกว่าความผิดพลาดไม่ใช่จุดจบ';
  } else if (p.ei === 2) {
    elementInsight = 'พลังแห่งลม <span style="font-size:14px">💨</span> ทำให้ความคิดคุณแล่นไวและยืดหยุ่น แต่มักทำให้คุณกระจัดกระจายและขาดจุดยืนเมื่อต้องเผชิญแรงกดดัน';
    elementAction = 'ฝึก <strong class="hl-gold">"การจดจ่อ (Deep Focus)"</strong> <span style="font-size:14px">🎯</span> ทำสิ่งใดสิ่งหนึ่งให้เสร็จโดยไม่ละสายตาไปเรื่องอื่น เพื่อสร้างสมอเรือให้ความคิด';
  } else {
    elementInsight = 'พลังแห่งน้ำ <span style="font-size:14px">🌊</span> ทำให้คุณลึกซึ้งและเข้าถึงจิตใจคน แต่ขอบเขตอารมณ์ที่พร่ามัวมักทำให้คุณรับเอาความรู้สึกคนอื่นมาเป็นของตัวเอง';
    elementAction = 'สร้าง <strong class="hl-gold">"ขอบเขตทางอารมณ์ (Boundaries)"</strong> <span style="font-size:14px">🛡️</span> ฝึกพูดคำว่า "ไม่" อย่างสุภาพ เพื่อปกป้องพลังงานบริสุทธิ์ของคุณเอง';
  }
  var wkFull = '<div style="font-size:14px; line-height:1.9; color:var(--tx); margin-bottom:15px;">'
    + '<span class="hl-gold">✦ ดวงดาวไม่ได้มีไว้เพื่อสาปแช่ง แต่มีไว้เพื่อชี้เป้าหมายที่รอการปลดล็อก ✦</span><br>'
    + 'สิ่งที่คุณมองว่าเป็นจุดอ่อน หรือ <span class="hl-purple">[' + tk.kala + ']</span> แท้จริงแล้วคือพลังงานแห่งดาว' + p.n + ' ที่ถูกใช้ผิดทิศทาง <span style="font-size:14px">🥀</span><br><br>'
    + elementInsight + ' หากปล่อยทิ้งไว้ มันจะค่อยๆ กัดเซาะความมั่นใจและโอกาสดีๆ ในชีวิตคุณโดยไม่รู้ตัว <span style="font-size:14px">🌪️</span>'
    + '</div>'
    + '<div class="action-plan-card">'
    + '<div class="ap-title">✦ พิมพ์เขียวเพื่อปรับฐานชีวิต ✦</div>'
    + '<div style="text-align:center; font-size:11px; color:#7a6a9a; margin-bottom:20px; letter-spacing:0.05em;">(THE STARVIA TRANSFORMATION BLUEPRINT)</div>'
    + '<div class="ap-step"><div class="ap-num">1</div><div class="ap-content"><h4><span style="font-size:15px; margin-right:4px;">👁️</span> สติรับรู้ (The Awakening)</h4><p>เมื่อไหร่ก็ตามที่คุณเริ่มรู้สึกว่า <strong class="hl-purple">"' + tk.kala + '"</strong> กำลังก่อตัวขึ้น ให้ถือว่านั่นคือสัญญาณเตือนจากดวงดาว <span style="font-size:13px">🔔</span> อย่ากล่าวโทษตัวเอง แต่ให้รับรู้ว่าเงามืดกำลังพยายามเข้ามาควบคุมพวงมาลัยชีวิตคุณ</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">2</div><div class="ap-content"><h4><span style="font-size:15px; margin-right:4px;">🧭</span> ลงมือปรับจูน (The Recalibration)</h4><p><span class="hl-gold">✧</span> ' + p.wkfix + '<br><br><span class="hl-gold">✧</span> นอกจากนี้ กุญแจสำคัญของคนธาตุ' + p.el + 'คือ <strong>' + elementAction + '</strong> <span style="font-size:13px">⏳</span> เริ่มต้นทำสิ่งนี้ให้เป็นนิสัยใน 21 วันข้างหน้า</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">3</div><div class="ap-content"><h4><span style="font-size:15px; margin-right:4px;">🦋</span> ยกระดับจิตวิญญาณ (The Evolution)</h4><p>เมื่อคุณปรับสมดุลข้อ 1 และ 2 ได้ พลังงานแห่งความขัดแย้งจะถูกเปลี่ยนเป็น <strong class="hl-gold">✨ ' + tk.sri + '</strong> โดยอัตโนมัติ คุณจะพบว่าผู้คน โอกาส และโชคลาภ <span style="font-size:13px">🕊️</span> จะถูกดึงดูดเข้ามาหาคุณอย่างเป็นธรรมชาติ เพราะฐานชีวิตคุณมั่นคงแล้ว</p></div></div>'
    + '<div class="ap-quote">"จุดอ่อนที่ถูกเยียวยา จะกลายเป็นจุดแข็งที่แข็งแกร่งที่สุดของคุณ <span style="font-style:normal">🤍</span>"</div>'
    + '</div>';

  // 3. พลังแห่งราศี (Zodiac Power)
  var rasiHtml = '<strong class="hl-gold">✦ พลังแห่งราศี' + r.n + ' (Zodiac Power):</strong><br>'
    + 'จักรราศีมอบ <span class="hl-purple">"' + (r.trait || 'พลังประจำตัว') + '"</span> ให้เป็นอาวุธประจำตัวของคุณ คุณสมบัติเด่นที่คุณควรดึงออกมาใช้ให้เกิดประโยชน์สูงสุดคือ <strong style="color:var(--tx);">' + (r.apply || 'ความเป็นตัวของตัวเอง') + '</strong><br><br>'
    + '<span style="font-size:12px; color:var(--tx2);">' + (r.add || '') + '</span>';

  // 4. พลังงานเสริมดวง (Standalone Card)
  var POWER_ELEMENTS = [
    { num: '1·4·5', c1: '#4CAF50', c1n: 'เขียว', c2: '#9C27B0', c2n: 'ม่วง' }, // 0
    { num: '2·4·6', c1: '#9C27B0', c1n: 'ม่วง', c2: '#FF9800', c2n: 'ส้ม' }, // 1
    { num: '3·5·8', c1: '#FF9800', c1n: 'ส้ม', c2: '#424242', c2n: 'ดำ/เทา' }, // 2
    { num: '2·4·5', c1: '#424242', c1n: 'ดำ/เทา', c2: '#2196F3', c2n: 'ฟ้า' }, // 3
    { num: '1·5·9', c1: '#F44336', c1n: 'แดง', c2: '#FFFFFF', c2n: 'ขาว' }, // 4
    { num: '2·3·6', c1: '#E91E63', c1n: 'ชมพู', c2: '#4CAF50', c2n: 'เขียว' }, // 5
    { num: '3·7·8', c1: '#2196F3', c1n: 'ฟ้า', c2: '#F44336', c2n: 'แดง' }  // 6
  ];
  var pe = POWER_ELEMENTS[dayOfWeek];
  var powerCardHtml = '<div class="power-card">'
    + '<div class="pc-header"><span style="font-size:16px;">✨</span> พลังงานเสริมดวง (Power Elements)</div>'
    + '<div class="pc-grid">'
    + '<div class="pc-item"><div class="pc-title">🔢 เลขขับเคลื่อนชีวิต</div><div class="pc-value">' + pe.num + '</div></div>'
    + '<div class="pc-item"><div class="pc-title">🎨 สีเสริมออร่า</div>'
    + '<div class="pc-colors">'
    + '<div class="pc-color-wrap"><div class="pc-color-dot" style="background:' + pe.c1 + ';"></div><div class="pc-color-name">' + pe.c1n + '</div></div>'
    + '<div class="pc-color-wrap"><div class="pc-color-dot" style="background:' + pe.c2 + ';"></div><div class="pc-color-name">' + pe.c2n + '</div></div>'
    + '</div></div>'
    + '</div>'
    + '<div class="pc-desc"><span class="hl-gold">เคล็ดลับ:</span> ใช้เลข <strong>' + pe.num + '</strong> ต่อท้ายชื่อไลน์/รหัสผ่าน และใช้สี <strong>' + pe.c1n + '/' + pe.c2n + '</strong> เป็นภาพพื้นหลังมือถือในวันสำคัญ เพื่อปรับคลื่นพลังงานดึงดูดความสำเร็จ</div>'
    + '</div>' // ปิด power-card
    + '<div class="share-btn-wrap"><button class="share-btn" data-action="save-image" data-target="power-card" data-filename="Lucky_Elements">📸 เซฟรูปภาพเลขมงคล</button></div>';

  var karma = buildKarmaMirror(p, dayOfWeek);
  var karmaHtml = '<div class="karma-card">'
    + '<div class="karma-kicker">Thai Life Blueprint</div>'
    + '<div class="karma-title">✦ ' + escapeHTML(karma.title) + ' ✦</div>'
    + '<div class="karma-desc">' + escapeHTML(karma.intro) + '</div>'
    + '<div class="karma-grid">'
    + '<div class="karma-item"><strong>รูปแบบที่มักวนซ้ำ</strong><br>' + escapeHTML(karma.pattern) + '</div>'
    + '<div class="karma-item"><strong>บทเรียนของดาว</strong><br>' + escapeHTML(karma.lesson) + '</div>'
    + '<div class="karma-item"><strong>เงาจากวันเกิด</strong><br>' + escapeHTML(karma.weekdayShadow) + '</div>'
    + '<div class="karma-item"><strong>สิ่งที่ควรทำเดือนนี้</strong><br>' + escapeHTML(karma.action) + '</div>'
    + '</div>'
    + '<div class="karma-ritual"><span>พิธีเล็ก ๆ 7 วัน:</span> ' + escapeHTML(karma.ritual) + '</div>'
    + '</div>';

  var briefData = buildDailyBrief(p, dayOfWeek, { name: pe.c1n, hex: pe.c1 });
  var cosmicBriefHtml = '<div class="cosmic-brief">'
    + '<div class="cb-title">✦ สรุปพลังงานวันนี้ · Daily Cosmic Brief ✦</div>'
    + '<div class="cb-line"><div class="cb-dot" style="background:' + briefData.colorHex + '"></div><div>' + briefData.energy + '</div></div>'
    + '<div class="cb-line"><div class="cb-dot" style="background:' + briefData.colorHex + '"></div><div>สีมงคลวันนี้: <strong style="color:' + briefData.colorHex + '">' + briefData.colorName + '</strong></div></div>'
    + '<div class="cb-line"><div class="cb-dot" style="background:#E8A0CF"></div><div>' + briefData.focus + '</div></div>'
    + '<div class="cb-line"><div class="cb-dot" style="background:#E8534A"></div><div>' + briefData.warning + '</div></div>'
    + '<div class="cb-line"><div class="cb-dot" style="background:var(--g)"></div><div>' + briefData.action + '</div></div>'
    + '</div>';

  // 5. ประกอบร่างการแสดงผล (Info + Power Elements + Radar)
  // Blueprint Header Card
  var blueprintCardHtml = '<div class="blueprint-card">'
    + '<div class="bp-kicker">Thai Life Blueprint · พิมพ์เขียวชีวิตไทย</div>'
    + '<div class="bp-title">✦ ' + nm + ' ✦</div>'
    + '<div class="bp-grid">'
    + '<div class="bp-item"><div class="bp-icon" style="color:' + p.c + '">' + p.s + '</div><div class="bp-label">ดาวเจ้าชะตา</div><div class="bp-value" style="color:' + p.c + '">' + p.n + '</div></div>'
    + '<div class="bp-item"><div class="bp-icon">🌍</div><div class="bp-label">ธาตุ</div><div class="bp-value">ธาตุ' + p.el + '</div></div>'
    + '<div class="bp-item"><div class="bp-icon" style="color:' + r.c + '">' + r.s + '</div><div class="bp-label">ราศีเกิด</div><div class="bp-value" style="color:' + r.c + '">' + r.n + '</div></div>'
    + '<div class="bp-item"><div class="bp-icon" style="color:' + l.c + '">' + l.s + '</div><div class="bp-label">ลัคนา</div><div class="bp-value" style="color:' + l.c + '">' + l.n + '</div></div>'
    + '<div class="bp-item"><div class="bp-icon">🎂</div><div class="bp-label">อายุ</div><div class="bp-value">' + ageTxt + '</div></div>'
    + '</div></div>';

  wrap.innerHTML = blueprintCardHtml
    + '<div class="brow"><span style="font-size:15px;color:'+p.c+'">'+p.s+'</span>'
    +'<span style="font-size:11px;color:#c8b87a"><strong style="color:#C9A227">'+nm+'</strong>'
    +' · <strong style="color:#C9A227">'+p.n+'</strong>'
    +' · <strong style="color:'+r.c+'">'+r.n+'</strong>'
    +' · <strong style="color:'+l.c+'">'+l.n+'</strong></span></div>'
    +'<div class="card" style="padding:13px;margin-bottom:14px"><div class="cgrid">'
    +'<div class="ci"><div class="ci-l">'+u.pl+'</div><div class="ci-v" style="color:'+p.c+'">'+p.s+' '+p.n+'</div><div class="ci-s">'+p.d+'</div></div>'
    +'<div class="ci"><div class="ci-l">'+u.rl+'</div><div class="ci-v" style="color:'+r.c+'">'+r.s+' '+r.n+'</div><div class="ci-s">'+u.rl2+': '+r.rl+'</div></div>'
    +'<div class="ci"><div class="ci-l">'+u.la+'</div><div class="ci-v" style="color:'+l.c+'">'+l.s+' '+l.n+'</div><div class="ci-s">'+u.ll+': '+l.rl+'</div></div>'
    +'<div class="ci"><div class="ci-l">'+u.dob+'</div><div class="ci-v" style="font-size:9px">'+td+'</div><div class="ci-s">'+tDisp+(tDisp?'<br>':'')+'<span style="color:#C9A227">'+ageTxt+'</span></div></div>'
    +'<div class="ci"><div class="ci-l">'+u.el+'</div><div class="ci-v">ธาตุ'+p.el+'</div><div class="ci-s">'+u.es+'</div></div>'
    +'<div class="ci"><div class="ci-l">'+u.ge+'</div><div class="ci-v">'+gd+'</div><div class="ci-s">'+nm+'</div></div>'
    +'</div></div>'
    + powerCardHtml 
    + karmaHtml
    + cosmicBriefHtml
    + buildElementRadar(p, r, l)
    +'<div class="tabs-w"><div class="tabs" id="tt0"></div></div><div id="ts0"></div>';

  // 6. อ้างอิงและเนื้อหาใน Tabs
  var refDesc = {
    p_r_l: 'วิเคราะห์จาก <span class="hl-purple">ดาวเจ้าชะตา ('+p.n+')</span> ที่บอกแก่นแท้ ผสมผสานกับ <span class="hl-purple">ราศี ('+r.n+')</span> ที่บอกวิธีแสดงออก และ <span class="hl-purple">ลัคนา ('+l.n+')</span> ที่บอกตัวตนเบื้องลึก',
    thaksa: 'วิเคราะห์จาก <span class="hl-purple">หลักทักษาปกรณ์</span> ศาสตร์โบราณที่ถอดรหัสวันเกิด เพื่อหา "ศรี" (พลังงานที่เสริมมงคล) และ "กาลกิณี" (พลังงานเงาที่คอยฉุดรั้ง)',
    wk: 'วิเคราะห์จากมุมตั้งฉากและเรือนอริ/มรณะ ของ <span class="hl-purple">ดาว'+p.n+'</span> ซึ่งสะท้อนจุดเปราะบางที่ซ่อนอยู่ในจิตใต้สำนึก',
    lv: 'วิเคราะห์จากเรือนปัตนิ (คู่ครอง) ผสมผสานกับลักษณะธาตุ'+p.el+' ซึ่งควบคุมวิธีที่คุณมอบและรับความรัก',
    ca: 'วิเคราะห์จากเรือนกัมมะ (การงาน) ของ <span class="hl-purple">ดาว'+p.n+'</span> และ <span class="hl-purple">ลัคนา'+l.n+'</span> ซึ่งกำหนดพื้นที่ที่คุณจะเปล่งประกายได้ดีที่สุด',
    mn: 'วิเคราะห์จากเรือนกดุมภะ (การเงิน) และลักษณะการใช้ทรัพยากรของคนธาตุ'+p.el,
    past: 'วิเคราะห์จากไทม์ไลน์ช่วงอายุที่ผ่านมา เพื่อดูว่าช่วงไหนชีวิตสร้างนิสัยนี้ขึ้นมา และอะไรพาคุณรอดมาได้',
    pres: 'วิเคราะห์จากช่วงอายุปัจจุบัน เพื่ออ่านว่าชีวิตกำลังทดสอบอะไร และควรปรับอะไรทันที',
    fut: 'วิเคราะห์จากช่วงอายุถัดไปและแนวโน้มชีวิต เพื่อเตรียมตัวก่อนเหตุการณ์สำคัญจะเข้ามา'
  };

  var TB=[
    {lb:u.t0[0], secs:[
      {t:u.s0[0], c:p.p, rf:refDesc.p_r_l},
      {t:'สไตล์การแสดงออก (ราศีเกิด)', c:rasiHtml, rf:'วิเคราะห์จากราศีเกิด ('+r.n+') ซึ่งเป็นรูปแบบพลังงานที่คุณใช้ขับเคลื่อนตัวเองบนโลกใบนี้'},
      {t:'รหัสผ่านชีวิต (ทักษาปกรณ์)', c:thaksaHtml, rf:refDesc.thaksa},
      {t:u.s0[1], c:p.str, rf:'วิเคราะห์จากพลังงานธาตุ'+p.el+' และลักษณะเด่นของดาว'+p.n}
    ]},
    {lb:'✦ ถอดรหัสเงาในใจ', secs:[
      {t:u.s0[2], c:wkFull, rf:refDesc.wk}
    ]},
    {lb:u.t0[1], secs:[{t:u.s0[3], c:p.lv, rf:refDesc.lv}]},
    {lb:u.t0[2], secs:[
      {t:u.s0[4], c:p.ca, rf:refDesc.ca},
      {t:u.s0[5], c:p.mn, rf:refDesc.mn}
    ]},
    {lb:u.t0[3], secs:[{t:u.s0[6], c:buildLifeTimeline('past', p, ageY, ageM), rf:refDesc.past}]},
    {lb:u.t0[4], secs:[{t:u.s0[7], c:buildLifeTimeline('present', p, ageY, ageM), rf:refDesc.pres}]},
    {lb:u.t0[5], secs:[{t:u.s0[8], c:buildLifeTimeline('future', p, ageY, ageM), rf:refDesc.fut}]}
  ];

  buildTabs('tt0','ts0','s0_',TB,p,u);
  
  // 7. กล่องนัดหมายส่วนตัว (ลิงก์ Inbox ของคุณ)
  var consultHtml = '<div class="private-consult-card">'
    + '<div class="pcc-subtitle">1-on-1 Private Reading</div>'
    + '<div class="pcc-title">✦ ปลดล็อกดวงชะตาแบบเจาะลึก ✦</div>'
    + '<div class="pcc-desc">ผลทำนายที่คุณเพิ่งอ่านเป็นเพียงเศษเสี้ยวของจักรวาลในตัวคุณ หากคุณกำลังเผชิญทางแยกของชีวิต หรือต้องการคำแนะนำแบบเจาะลึกเพื่อก้าวข้ามอุปสรรค... ให้ดวงดาวและเราช่วยนำทาง</div>'
    + '<a href="https://m.me/61573341702581" target="_blank" class="pcc-btn">จองคิวปรึกษาส่วนตัว</a>'
    + '</div>';

  document.getElementById('ts0').insertAdjacentHTML('beforeend',
    '<div class="mc"><div class="mc-l">✦ '+u.mn+' · '+nm+' ✦</div>'
    +'<div class="mc-t">"'+p.man+'"</div></div>'
    + consultHtml 
    +'<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="0">'+u.r0+'</button></div>'
  );
}

// อัปเกรดฟังก์ชันสร้าง Tabs ให้รองรับระบบ Freemium
function buildTabs(tid,sid,pre,TB,p,u){
  var tt=document.getElementById(tid), ts2=document.getElementById(sid);
  
  TB.forEach(function(tb,i){
    var btn=document.createElement('button');
    btn.className='tab'+(i===0?' on':'');
    btn.textContent=tb.lb;
    btn.addEventListener('click', function(){
      document.querySelectorAll('#'+tid+' .tab').forEach(function(t){t.classList.remove('on');});
      document.querySelectorAll('#'+sid+' .sec').forEach(function(s){s.classList.remove('on');});
      btn.classList.add('on');
      document.getElementById(pre+i).classList.add('on');
    });
    tt.appendChild(btn);
    
    var sec=document.createElement('div');
    sec.className='sec'+(i===0?' on':'');
    sec.id=pre+i;

    // 💡 กำหนดแท็บที่จะล็อค: 
    // i === 0 คือแท็บแรก (ตัวตนและบุคลิกภาพ) จะปล่อยฟรีเสมอ!
    // i > 0 คือตั้งแต่แท็บที่ 2 เป็นต้นไป (จุดอ่อน, ความรัก, การงาน, อดีตชาติ ฯลฯ) จะถูกล็อค
    var isPremiumTab = false;
    if (i > 0) isPremiumTab = true; 

    // ใส่คลาสเบลอ ถ้าเป็นแท็บพรีเมียมและยังไม่ได้จ่ายเงิน
    if (isPremiumTab && !isPremiumUnlocked()) {
       sec.classList.add('is-locked');
    }

    var html='<div class="orn">✦ · ✦ · ✦</div>';
    tb.secs.forEach(function(s){
      html+='<div class="st">'+s.t+'</div>';
      if(s.c==='habits'){
        p.hb.forEach(function(h,n){ html+='<div class="hi"><div class="hn">'+(n+1)+'</div><div class="ht">'+h+'</div></div>'; });
      } else {
        html+='<div class="rb">'+s.c+'<div class="ref">'+u.rf+' '+s.rf+'</div></div>';
      }
    });

    // วาดกล่องแม่กุญแจทับเนื้อหาที่เบลอไว้
    if (isPremiumTab && !isPremiumUnlocked()) {
        html += '<div class="lock-overlay">'
              + '<div style="font-size:35px; margin-bottom:10px; filter:drop-shadow(0 2px 5px rgba(0,0,0,0.5));">🔒</div>'
              + '<div style="color:#C9A227; font-size:16px; font-weight:700; margin-bottom:5px;">เนื้อหาเจาะลึกเฉพาะคุณ (Premium)</div>'
              + '<div style="color:#b8a8d8; font-size:13px; margin-bottom:15px; max-width:280px; line-height:1.6;">ปลดล็อกเพื่ออ่านการวิเคราะห์ดวงชะตาเชิงลึก ทั้งด้านความรัก การงาน อดีตชาติ และจุดอ่อนที่ซ่อนอยู่</div>'
              + '<button class="pdf-btn" data-action="open-payment" style="padding:10px 24px; font-size:13px; box-shadow:0 4px 15px rgba(201,162,39,0.3);">ปลดล็อกรีพอร์ตฉบับเต็ม 199 THB</button>'
              + '</div>';
    }

    sec.innerHTML=html;
    ts2.appendChild(sec);
  });
}

function resetM(mode){
  var fc=['fc0','fc1','fc2'][mode], r=['r0','r1','r2'][mode];
  document.getElementById(r).innerHTML='';
  document.getElementById(fc).style.display='block';
  scrollTo({top:0,behavior:'smooth'});
}

// ===== MODE 1: Couple =====
function go1(){
  var da=document.getElementById('d1a').value, db=document.getElementById('d1b').value;
  if(!da||!db)return;
  var u=U(), PL2=getPL(), RA2=getRA();
  var def=u.def||['คนที่หนึ่ง','คนที่สอง'];
  var na=document.getElementById('n1a').value||def[0];
  var nb=document.getElementById('n1b').value||def[1];
  var ta=document.getElementById('t1a').value||'06:00';
  var tb=document.getElementById('t1b').value||'06:00';
  var pa=PL2[new Date(da).getDay()], pb=PL2[new Date(db).getDay()];
  var ria=getRasi(da), rib=getRasi(db);
  var lia=getLagna(da,ta), lib=getLagna(db,tb);
  document.getElementById('fc1').style.display='none';
  showLoad();
  setTimeout(function(){
    hideLoad();
    renderCouple(na,pa,RA2[ria],RA2[lia],ria,lia,nb,pb,RA2[rib],RA2[lib],rib,lib,u,RA2);
  },900);
}

function renderCouple(na,pa,ra,la,ria,lia,nb,pb,rb,lb2,rib,lib,u,RA2){
  var wrap=document.getElementById('r1');
  na = escapeHTML(na);
  nb = escapeHTML(nb);
  var elS=ELC[pa.ei][pb.ei];
  var piA=getPL().indexOf(pa), piB=getPL().indexOf(pb);
  var plS=PLC[piA>=0?piA:0][piB>=0?piB:0];
  var ang=rasiAngle(ria,rib), angS=ang[0], angD=ang[1];
  var lgS=ELC[RA2[lia].el][RA2[lib].el];
  
  // คำนวณคะแนนความเข้ากันได้
  var total=Math.round(elS*.3+plS*.3+angS*.25+lgS*.15);
  var ELD=getELD();
  var elDesc=ELD[pa.ei][pb.ei];

  // ระบบตัดเกรด (S, A, B, C, D)
  var gradeLtr = total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : 'D';
  var gradeLbl = total >= 90 ? 'Soulmate Energy (คู่แท้ส่งเสริมกัน)' : 
                 total >= 80 ? 'Harmonious Pair (คู่ที่เข้ากันได้ดีเยี่ยม)' : 
                 total >= 70 ? 'Growing Together (คู่ที่ต้องเรียนรู้และเติบโต)' : 
                 total >= 60 ? 'Understanding Needed (คู่ที่ต้องใช้ความเข้าใจสูง)' : 
                               'Karmic Lesson (คู่เวรคู่กรรม/บทเรียนสำคัญ)';

  var dharma = getCoupleDharmaType(total, elS, pa.ei === pb.ei);
  var dharmaHtml = '<div class="dharma-card">'
    + '<div class="dharma-kicker">Couple Dharma Map</div>'
    + '<div class="dharma-label">' + escapeHTML(dharma.label) + '</div>'
    + '<div class="dharma-title">' + escapeHTML(dharma.title) + '</div>'
    + '<div class="dharma-intro">' + escapeHTML(dharma.intro) + '</div>'
    + '<div class="dharma-grid">'
    + '<div><strong>สิ่งที่คู่นี้มาเรียนรู้ร่วมกัน</strong><br>' + escapeHTML(dharma.meaning) + '</div>'
    + '<div><strong>วิธีดูแลความสัมพันธ์</strong><br>' + escapeHTML(dharma.advice) + '</div>'
    + '</div>'
    + '</div>';

  // สร้าง Viral Matrix Card
  var matrixHtml = '<div class="matrix-card">'
    + '<div class="mx-names">'
    + '<div class="mx-person"><div class="mx-n">' + na + '</div><div class="mx-p">' + pa.s + ' ' + pa.n + ' · ธาตุ' + pa.el + '</div></div>'
    + '<div class="mx-heart">♡</div>'
    + '<div class="mx-person"><div class="mx-n">' + nb + '</div><div class="mx-p">' + pb.s + ' ' + pb.n + ' · ธาตุ' + pb.el + '</div></div>'
    + '</div>'
    
    + '<div class="mx-score-wrap">'
    + '<div class="mx-title">The Compatibility Matrix</div>'
    + '<div class="mx-score">' + total + '% <span class="mx-grade">' + gradeLtr + '</span></div>'
    + '<div class="mx-lbl">' + gradeLbl + '</div>'
    + '<div class="mx-lbl dharma-chip">' + escapeHTML(dharma.label) + '</div>'
    + '</div>'

    + '<div class="chem-box">'
    + '<div class="chem-title"><span style="font-size:14px">⚗️</span> ปฏิกิริยาเคมีธาตุ (Element Chemistry)</div>'
    + '<div class="chem-desc">' + elDesc + '</div>'
    + '</div>' // ปิด chem-box
    + '</div>' // ปิด matrix-card
    + '<div class="share-btn-wrap"><button class="share-btn" data-action="save-image" data-target="matrix-card" data-filename="Soulmate_Matrix" style="color:#C9A227; border-color:rgba(201,162,39,0.4);">📸 เซฟรูปคะแนนคู่รัก</button></div>';

  wrap.innerHTML = matrixHtml
    + dharmaHtml
    +'<div class="cg2">'
    +'<div class="ci2"><div class="ci2l">'+u.ec+'</div><div class="ci2s">'+pa.el+' + '+pb.el+'</div><div class="ci2v">'+elS+'%</div></div>'
    +'<div class="ci2"><div class="ci2l">'+u.pc+'</div><div class="ci2s">'+pa.s+' + '+pb.s+'</div><div class="ci2v">'+plS+'%</div></div>'
    +'<div class="ci2"><div class="ci2l">'+u.rc+'</div><div class="ci2s">'+ra.s+' + '+rb.s+'</div><div class="ci2v">'+angS+'%</div></div>'
    +'<div class="ci2"><div class="ci2l">'+u.lc+'</div><div class="ci2s">'+RA2[lia].s+' + '+RA2[lib].s+'</div><div class="ci2v">'+lgS+'%</div></div>'
    +'</div>'
    +'<div class="tabs-w"><div class="tabs" id="tt1"></div></div><div id="ts1"></div>';

  // สร้าง Action Plan สำหรับคู่รัก
  var strG = elS>=80 ? 'ธาตุ'+pa.el+'และ'+pb.el+'ที่ส่งเสริมกันอย่างเป็นธรรมชาติ' : 'ความแตกต่างของธาตุที่ทำให้อีกฝ่ายได้เห็นมุมมองใหม่';
  var strW = pa.ei===pb.ei ? 'การสะท้อนจุดอ่อนของกันและกันจนขยายใหญ่ขึ้น' : 'การตีความความแตกต่างว่าเป็นความขัดแย้งแทนที่จะมองว่าเป็นการเติมเต็ม';
  
  var actionPlanHtml = '<div class="action-plan-card" style="margin-top:0;">'
    + '<div class="ap-title">✦ พิมพ์เขียวความสัมพันธ์ ✦</div>'
    + '<div class="ap-step"><div class="ap-num">1</div><div class="ap-content"><h4>จุดแข็งที่ต้องรักษา</h4><p>ความสัมพันธ์นี้มีจุดเด่นเรื่อง <strong>' + strG + '</strong> จงใช้สิ่งนี้เป็นกาวใจในวันที่ทะเลาะกัน</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">2</div><div class="ap-content"><h4>หลุมพรางที่ต้องระวัง</h4><p>สิ่งที่ดาวเตือนคือ <strong>' + strW + '</strong> เมื่อเกิดปัญหานี้ ให้หยุดพัก 15 นาทีก่อนคุยต่อเพื่อลดการใช้อารมณ์</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">3</div><div class="ap-content"><h4>คำแนะนำจากดวงดาว</h4><p>ความสัมพันธ์ที่ยั่งยืนไม่ได้เกิดจากดวงที่สมบูรณ์แบบ แต่เกิดจากคนสองคนที่ไม่ยอมแพ้ต่อกัน หมั่นสื่อสารความต้องการอย่างตรงไปตรงมาและให้เกียรติกันเสมอ</p></div></div>'
    + '</div>';

  var CT=[
    {lb:u.ct[0], secs:[{t:'ผลวิเคราะห์เคมีคู่รัก', c:actionPlanHtml, rf:'หลักดวงสมพงศ์ (Synastry) ผสมผสานหลักจิตวิทยาความสัมพันธ์'}]},
    {lb:u.ct[1], secs:[{t:u.cs[1], c:elDesc, rf:'Four Elements | '+pa.el+' + '+pb.el+' | Score: '+elS+'%'}]},
    {lb:u.ct[2], secs:[{t:u.cs[2], c:ra.n+' meets '+rb.n+' — '+angD, rf:'Sign synastry | '+ra.n+' + '+rb.n+' | Score: '+angS+'%'}]},
    {lb:u.ct[3], secs:[{t:u.cs[3], c:'ลัคนาของ'+na+'ตกในราศี'+RA2[lia].n+' — '+RA2[lia].add+'<br><br>ลัคนาของ'+nb+'ตกในราศี'+RA2[lib].n+' — '+RA2[lib].add, rf:'Lagna '+RA2[lia].n+' + '+RA2[lib].n+' | Score: '+lgS+'%'}]}
  ];

  var tt=document.getElementById('tt1'), ts2=document.getElementById('ts1');
  CT.forEach(function(tb,i){
    var btn=document.createElement('button');
    btn.className='tab'+(i===0?' on':'');
    btn.textContent=tb.lb;
    btn.addEventListener('click', function(){
      document.querySelectorAll('#tt1 .tab').forEach(function(t){t.classList.remove('on');});
      document.querySelectorAll('#ts1 .sec').forEach(function(s){s.classList.remove('on');});
      btn.classList.add('on');
      document.getElementById('c1_'+i).classList.add('on');
    });
    tt.appendChild(btn);
    var sec=document.createElement('div');
    sec.className='sec'+(i===0?' on':'');
    sec.id='c1_'+i;
    var html='<div class="orn">✦ · ✦ · ✦</div>';
    tb.secs.forEach(function(s){
      html+='<div class="st">'+s.t+'</div><div class="rb" style="background:transparent; border:none; padding:0;">'+s.c+'<div class="ref" style="margin-top:15px;">'+u.rf+' '+s.rf+'</div></div>';
    });
    sec.innerHTML=html;
    ts2.appendChild(sec);
  });
  
  ts2.insertAdjacentHTML('beforeend',
    '<div class="mc" style="margin-top:20px;"><div class="mc-l">✦ '+u.cm+' ✦</div>'
    +'<div class="mc-t">"'+u.cv2+'"</div></div>'
    +'<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="1">'+u.r1+'</button></div>'
  );
}

// ===== MODE 2: Auspicious =====
function go2(){
  var ds=document.getElementById('d2').value; if(!ds)return;
  var u=U(), PL2=getPL();
  var nm=document.getElementById('n2').value||(u.pdef||'บุคคลนี้');
  var pw=new Date(ds).getDay(), p=PL2[pw];
  document.getElementById('fc2').style.display='none';
  showLoad();
  setTimeout(function(){ hideLoad(); renderAusp(nm,p,pw,u); }, 700);
}

function renderAusp(nm,p,pw,u){
  var wrap=document.getElementById('r2');
  nm = escapeHTML(nm);
  // Personal header card
  var elementEmoji = p.el === 'ไฟ' ? '🔥' : p.el === 'ดิน' ? '🪨' : p.el === 'ลม' ? '💨' : '💧';
  var connectionMsg = 'พลังงานจากดาว' + p.n + ' (' + p.el + ') เสริมจังหวะชีวิตของคุณ';
  var auspHeaderHtml = '<div class="ausp-header-card">'
    + '<div class="ahp-planet" style="color:' + p.c + '">' + p.s + '</div>'
    + '<div class="ahp-info">'
    + '<div class="ahp-name">' + nm + ' — ธาตุ' + p.el + ' ' + elementEmoji + '</div>'
    + '<div class="ahp-connection">' + connectionMsg + '</div>'
    + '</div></div>';
  var DN=u.dn;
  var DS=['☉','☽','♂','☿','♃','♀','♄'];
  var DC=['#FFB84D','#C8DCF0','#E8534A','#6EC89A','#F5A623','#E8A0CF','#9B8AB8'];

  // 1. ระบบดึงสีมงคลตาม "วันปัจจุบันอัตโนมัติ" (ให้คนเปิดแอปทุกเช้า)
  var TODAY_COLORS = [
    { d: 'อาทิตย์', luck: '#4CAF50', luckN: 'เขียว (รับทรัพย์)', work: '#9C27B0', workN: 'ม่วง (ผู้ใหญ่เอ็นดู)', bad: '#2196F3', badN: 'ฟ้า/น้ำเงิน (เลี่ยง)' }, // 0
    { d: 'จันทร์', luck: '#9C27B0', luckN: 'ม่วง (รับทรัพย์)', work: '#FF9800', workN: 'ส้ม (ผู้ใหญ่เอ็นดู)', bad: '#F44336', badN: 'แดง (เลี่ยง)' }, // 1
    { d: 'อังคาร', luck: '#FF9800', luckN: 'ส้ม (รับทรัพย์)', work: '#424242', workN: 'เทา/ดำ (ผู้ใหญ่เอ็นดู)', bad: '#FFFFFF', badN: 'ขาว/เหลือง (เลี่ยง)' }, // 2
    { d: 'พุธ', luck: '#424242', luckN: 'เทา/ดำ (รับทรัพย์)', work: '#2196F3', workN: 'ฟ้า/น้ำเงิน (ผู้ใหญ่เอ็นดู)', bad: '#E91E63', badN: 'ชมพู (เลี่ยง)' }, // 3
    { d: 'พฤหัสบดี', luck: '#F44336', luckN: 'แดง (รับทรัพย์)', work: '#FFFFFF', workN: 'ขาว/ครีม (ผู้ใหญ่เอ็นดู)', bad: '#9C27B0', badN: 'ม่วง (เลี่ยง)' }, // 4
    { d: 'ศุกร์', luck: '#E91E63', luckN: 'ชมพู (รับทรัพย์)', work: '#4CAF50', workN: 'เขียว (ผู้ใหญ่เอ็นดู)', bad: '#424242', badN: 'เทา/ดำ (เลี่ยง)' }, // 5
    { d: 'เสาร์', luck: '#2196F3', luckN: 'ฟ้า/น้ำเงิน (รับทรัพย์)', work: '#F44336', workN: 'แดง (ผู้ใหญ่เอ็นดู)', bad: '#4CAF50', badN: 'เขียว (เลี่ยง)' } // 6
  ];
  var todayIdx = new Date().getDay(); // ดึงวันปัจจุบันจากเครื่องผู้ใช้
  var tc = TODAY_COLORS[todayIdx];

  var colorHtml = '<div class="wellness-card">'
    + '<div class="wc-title"><span style="font-size:16px;">✨</span> พลังงานสีประจำวันนี้ (วัน'+tc.d+')</div>'
    + '<div class="color-day">'
    + '<div class="cd-row">'
    + '<div class="cd-item"><div class="cd-dot" style="background:'+tc.luck+';"></div><div class="cd-lbl" style="color:var(--g);">'+tc.luckN+'</div></div>'
    + '<div class="cd-item"><div class="cd-dot" style="background:'+tc.work+';"></div><div class="cd-lbl" style="color:var(--g);">'+tc.workN+'</div></div>'
    + '<div class="cd-item"><div class="cd-dot" style="background:'+tc.bad+'; border-color:rgba(255,0,0,0.4);"></div><div class="cd-lbl" style="color:#c06080">'+tc.badN+'</div></div>'
    + '</div>'
    + '<div style="font-size:10px; color:var(--tx2); margin-top:16px; text-align:center;">*ระบบอัปเดตอัตโนมัติตามวันปัจจุบัน เพื่อให้คุณจัดเตรียมเสื้อผ้าหรือสิ่งของเครื่องใช้ในทุกๆ เช้า</div>'
    + '</div>'
    + '</div>';

  // 2. Cosmic Routine (ตารางนาฬิกาชีวิตตามธาตุเกิดของเจ้าชะตา)
  var routines = {
    'ไฟ': [
      { t: '06:00 - 08:00', d: '<strong>Ignite (ปลุกพลัง):</strong> ออกกำลังกายเรียกเหงื่อ หรือตั้งเป้าหมาย 3 อย่างที่ต้องทำให้สำเร็จในวันนี้' },
      { t: '09:00 - 14:00', d: '<strong>Blaze (ลุยงาน):</strong> ช่วงพลังสูงสุด! จัดการงานที่ยากที่สุดหรือต้องใช้ความกล้าหาญ' },
      { t: '15:00 - 17:00', d: '<strong>Radiate (กระจายแสง):</strong> ประชุมทีม สื่อสารสร้างเครือข่าย หรือให้ความช่วยเหลือคนรอบข้าง' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Ember (พักฟื้น):</strong> ลดการใช้หน้าจอ อาบน้ำอุ่น ปล่อยให้ความใจร้อนและอีโก้ค่อยๆ สงบลง' }
    ],
    'ดิน': [
      { t: '06:00 - 08:00', d: '<strong>Ground (ตั้งหลัก):</strong> ยืดเหยียดร่างกาย ดื่มน้ำเปล่า รดน้ำต้นไม้ และจัดลำดับงานอย่างช้าๆ' },
      { t: '09:00 - 15:00', d: '<strong>Build (สร้างสรรค์):</strong> ช่วง Deep Work ทำงานที่ต้องใช้สมาธิและความละเอียดรอบคอบสูง' },
      { t: '16:00 - 18:00', d: '<strong>Organize (จัดระเบียบ):</strong> สะสางอีเมล จัดโต๊ะทำงาน หรือวางแผนการเงิน/งานสำหรับวันพรุ่งนี้' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Settle (สงบใจ):</strong> ทานอาหารมื้ออร่อย อยู่กับคนที่รัก และคลายกล้ามเนื้อที่ตึงเครียด' }
    ],
    'ลม': [
      { t: '06:00 - 08:00', d: '<strong>Breathe (เปิดรับ):</strong> อ่านบทความ ฟังพอดแคสต์ หรือเขียน Journal เพื่อระบายความคิดที่วิ่งวน' },
      { t: '09:00 - 12:00', d: '<strong>Flow (ลื่นไหล):</strong> ระดมสมอง (Brainstorm) คิดงานครีเอทีฟ หรือเริ่มต้นเรียนรู้สิ่งใหม่ๆ' },
      { t: '13:00 - 16:00', d: '<strong>Connect (เชื่อมโยง):</strong> นัดหมายลูกค้า นำเสนองาน หรือพูดคุยแลกเปลี่ยนไอเดียกับผู้คน' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Still (หยุดนิ่ง):</strong> งดรับข้อมูลข่าวสาร ฝึกทำสมาธิ หรือทำกิจกรรมที่ต้องโฟกัสสิ่งเดียว' }
    ],
    'น้ำ': [
      { t: '06:00 - 08:00', d: '<strong>Reflect (สะท้อนใจ):</strong> นั่งสมาธิ ฟังเพลงบรรเลง และเช็กความรู้สึกของตัวเองก่อนเริ่มวันใหม่' },
      { t: '09:00 - 12:00', d: '<strong>Nurture (ดูแล):</strong> ทำงานที่ต้องใช้ความเห็นอกเห็นใจ ดูแลลูกค้า หรือประสานงานซัพพอร์ตทีม' },
      { t: '13:00 - 16:00', d: '<strong>Create (สร้างผลงาน):</strong> ใช้สัญชาตญาณและอารมณ์ศิลป์ในการสร้างสรรค์ผลงานหรือแก้ปัญหา' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Cleanse (ชำระล้าง):</strong> แช่น้ำอุ่น เขียนบันทึกขอบคุณ ปล่อยวางความรู้สึกของผู้อื่นที่แบกรับมาทั้งวัน' }
    ]
  };
  var myRoutine = routines[p.el];
  var routineHtml = '<div class="wellness-card">'
    + '<div class="wc-title"><span style="font-size:16px;">⏳</span> นาฬิกาชีวิตธาตุ'+p.el+' (Cosmic Routine)</div>'
    + '<div style="font-size:11.5px; color:var(--tx2); margin-bottom:16px; text-align:center; line-height:1.6;">ตารางเวลาที่สอดคล้องกับพลังงานดวงดาวของคุณ ปรับใช้เพื่อดึงศักยภาพออกมาได้สูงสุดและลดความเหนื่อยล้า</div>';
  myRoutine.forEach(function(rt){
    routineHtml += '<div class="time-block"><div class="tb-time">'+rt.t+'</div><div class="tb-desc">'+rt.d+'</div></div>';
  });
  routineHtml += '</div>';

  // 3. ปฏิทินวันมงคล (Auspicious Days)
  var dg='<div class="dg">';
  for(var i=0;i<7;i++){
    var sc=PLC[pw][i], lv=sc>=85?'good':sc>=70?'mid':'bad';
    var lt=lv==='good'?u.dg:lv==='mid'?u.dm:u.db2;
    var lc=lv==='good'?'g':lv==='mid'?'m':'b';
    dg+='<div class="di '+lv+'"><div class="dn2">'+DN[i]+'</div><div class="dsym" style="color:'+DC[i]+'">'+DS[i]+'</div><div class="dlv '+lc+'">'+lt+'</div></div>';
  }
  dg+='</div>';

  var ACTS_TH=[['เริ่มโปรเจกต์ใหม่',pw,(pw+4)%7],['เจรจา/เซ็นสัญญา',3,4],['พบผู้ใหญ่/นำเสนองาน',4,0],['การเงิน/ลงทุน',5,4],['ความรัก/ออกเดต',5,1]];
  var ACTIVITY_TIMES = {
    'ไฟ': ['06:00–08:00', '09:00–14:00', '09:00–14:00', '09:00–14:00', '06:00–08:00'],
    'ดิน': ['09:00–15:00', '09:00–15:00', '09:00–15:00', '16:00–18:00', '09:00–15:00'],
    'ลม': ['09:00–12:00', '13:00–16:00', '13:00–16:00', '09:00–12:00', '13:00–16:00'],
    'น้ำ': ['09:00–12:00', '09:00–12:00', '13:00–16:00', '09:00–12:00', '13:00–16:00']
  };
  var actTimes = ACTIVITY_TIMES[p.el] || ACTIVITY_TIMES['ไฟ'];
  var ah='';
  ACTS_TH.forEach(function(a, aIdx){
    ah+='<div class="hi"><div class="hn" style="width:auto;border-radius:7px;padding:0 8px;font-size:10px">'+a[0]+'</div>'
      +'<div class="ht" style="font-size:12px;">'+u.ab+' <strong style="color:#C9A227">'+u.ad+DN[a[1]]+'</strong> <span style="font-size:10px;color:var(--tx2);">(รองลงมา: '+u.ad+DN[a[2]]+')</span>'
      +'<span class="act-time-window">⏰ '+actTimes[aIdx]+'</span></div></div>';
  });

  // รวบรวมข้อมูลทั้งหมดแสดงผล
  wrap.innerHTML=
    auspHeaderHtml
    +'<div class="brow"><span style="font-size:15px;color:'+p.c+'">'+p.s+'</span>'
    +'<span style="font-size:11px;color:#c8b87a"><strong style="color:#C9A227">'+nm+'</strong>'
    +' · <strong style="color:#C9A227">'+p.n+'</strong> · ตารางชีวิตประจำวัน</span></div>'
    
    + colorHtml 
    + routineHtml

    +'<div class="card" style="padding:18px;margin-bottom:13px">'
    +'<div class="st">ปฏิทินวันมงคลส่วนตัว (Auspicious Days)</div>'+dg
    +'<div class="ref" style="margin-bottom:18px;">'+u.rf+' วันที่พลังงานดาวบนท้องฟ้าส่งเสริมดวงชะตาของคุณ</div>'
    + ah
    +'</div>'

    +'<div class="mc"><div class="mc-l">✦ '+u.am+' ✦</div><div class="mc-t" style="font-size:13.5px; line-height:1.9; font-weight:normal;">"เวลาที่ดีที่สุดคือเวลาที่คุณพร้อมที่สุด ดาวเป็นเพียงแสงนำทาง แต่จังหวะก้าวเดินเป็นของคุณ"</div></div>'
    +'<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="2">'+u.r2+'</button></div>';
}

// Max date
['d0','d1a','d1b','d2'].forEach(function(id){
  var el=document.getElementById(id);
  if(el) el.max=new Date().toISOString().split('T')[0];
});

// ===== SAVE IMAGE (IG STORY) =====
