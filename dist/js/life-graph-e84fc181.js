/**
 * life-graph.js — คำนวณกราฟชีวิตเฉพาะบุคคลจากวันเกิดจริง
 * ใช้หลัก "พยากรณ์ศาสตร์เลข 12 ตัว" ผสมโหราศาสตร์ไทย
 * 
 * INPUT:  birthDay (1-31), birthMonth (1-12), birthYearBE (พ.ศ.), ageY (อายุปัจจุบัน)
 * OUTPUT: object { phases, currentPhase, currentAge, progress, element, scores, ... }
 * 
 * KEY DIFFERENTIATOR: ทุก pivot age, energy score, label ล้วนคำนวณจากวันเกิดจริง
 * — ไม่มี 2 คนไหนได้กราฟเหมือนกันยกเว้นเกิดวันเดียวกัน
 */

// ===== UTILS =====
function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n).split('').reduce(function(a, b) { return a + Number(b); }, 0);
  }
  return n;
}

function seededRandom(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ===== CORE CALCULATION =====

/**
 * คำนวณ "เลขชีวิต" (Life Path Number) จากวันเดือนปี
 * ตามหลักเลขศาสตร์ไทย: บวกวัน+เดือน+ปี(ค.ศ.) แล้วลดทอน
 */
function calculateLifePath(day, month, yearCE) {
  var d = reduceNum(day);
  var m = reduceNum(month);
  var y = reduceNum(yearCE);
  return reduceNum(d + m + y);
}

/**
 * คำนวณ "เลข 12 ตัว" — พื้นฐานของกราฟชีวิต
 * ใช้ วัน+เดือน+ปี (พ.ศ.) มาบวกกันแล้วแยกเป็น 12 หลัก
 */
function calculateTwelveDigits(day, month, yearBE) {
  var raw = String(day).padStart(2,'0') + String(month).padStart(2,'0') + String(yearBE);
  var digits = [];
  for (var i = 0; i < raw.length && i < 12; i++) {
    digits.push(Number(raw[i]));
  }
  // Pad to exactly 12
  while (digits.length < 12) {
    digits.push(reduceNum(digits.reduce(function(a,b){return a+b;}, 0)));
  }
  return digits;
}

/**
 * คำนวณ pivot ages (จุดเปลี่ยนชีวิต) — หัวใจของความแตกต่าง
 * แต่ละคนจะมี pivot ages ต่างกันตามวันเกิด
 */
function buildPivotAges(lifePath, day, month, yearBE) {
  var digits12 = calculateTwelveDigits(day, month, yearBE);
  var pivots = [];

  // Base spread: กำหนดช่วงอายุหลัก 6 จุดให้กระจายทั่วชีวิต
  // แต่ละคนจะมี offset ต่างกันตามวันเกิด
  var baseAges = [7, 18, 30, 42, 55, 68];
  var seed = lifePath * 100 + day * 10 + month;

  for (var i = 0; i < 6; i++) {
    // ใช้ digit sequence สร้าง variation ±5 ปี
    var digitOffset = (digits12[i] || 0) - 4.5; // -4.5 to +4.5
    var pivot = Math.round(baseAges[i] + digitOffset + (seededRandom(seed + i) * 4 - 2));

    // Clamp 7-72 — ไม่ให้กราฟดัน "ช่วงดี" ไปไกลจนเหมือนต้องรอแก่
    pivot = Math.min(72, Math.max(7, pivot));

    // Ensure strictly increasing
    if (i > 0 && pivot <= pivots[i - 1]) {
      pivot = pivots[i - 1] + 4;
    }
    if (pivot > 72) pivot = 72;

    pivots.push(pivot);
  }

  return pivots;
}

/**
 * คำนวณ energy score (0-100) สำหรับแต่ละอายุ
 * ใช้ composite wave จาก lifePath + day + month
 */
function calculateEnergyAtAge(age, lifePath, day, month, yearBE) {
  var digits12 = calculateTwelveDigits(day, month, yearBE);
  
  // Base: ตำแหน่งใน life cycle
  var cyclePeriod = lifePath * 4 + 7; // ~19-43 year cycles
  var phase = (age % cyclePeriod) / cyclePeriod; // 0.0 - 1.0
  var baseSin = Math.sin(phase * Math.PI * 2);
  
  // Amplitude: month (1-12) maps to 15-45
  var amplitude = 15 + (month / 12) * 30;
  
  // Wave 1: Primary life cycle
  var wave1 = baseSin * amplitude;
  
  // Wave 2: Secondary from day
  var wave2 = Math.sin(age * Math.PI / (day + 18)) * (amplitude * 0.4);
  
  // Wave 3: Micro-variation from 12-digit sequence
  var digitIndex = age % 12;
  var microWave = (digits12[digitIndex] - 4.5) * 3;
  
  // Noise from year
  var yearlyNoise = seededRandom(lifePath * 1000 + day * 100 + month * 10 + age) * 8 - 4;
  
  // Center around 55 (กลางๆ) + variations
  var score = 55 + wave1 + wave2 + microWave + yearlyNoise;
  
  // Clamp 5-100
  return Math.round(Math.max(5, Math.min(100, score)));
}

/**
 * Returns label and color for an energy score
 */
function getEnergyLabel(score) {
  if (score >= 80) return { level: 'ปีทอง', icon: '✨', color: '#FFD700', cssClass: 'lg-golden' };
  if (score >= 60) return { level: 'ปีดี', icon: '🌟', color: '#4CAF50', cssClass: 'lg-good' };
  if (score >= 40) return { level: 'ปานกลาง', icon: '🌤️', color: '#FFC107', cssClass: 'lg-mid' };
  if (score >= 20) return { level: 'ปีท้าทาย', icon: '⚡', color: '#FF9800', cssClass: 'lg-challenge' };
  return { level: 'เปลี่ยนผ่าน', icon: '🌙', color: '#9E9E9E', cssClass: 'lg-transition' };
}

// Phase label pools — หมุนเวียนตาม pivot index
var PHASE_LABEL_POOLS = [
  ['ตั้งรากฐาน', 'เพาะเมล็ด', 'วางศิลาฤกษ์', 'จุดเริ่ม', 'ปฐมบท', 'แรกเริ่ม'],
  ['ค้นหาตน', 'รู้จักตน', 'ค้นพบตัว', 'สำรวจตน', 'เข้าใจตัว', 'รู้ใจ'],
  ['ทดสอบโลก', 'ลองเชิง', 'ประลองกำลัง', 'วัดดวง', 'ทดสอบฝีมือ', 'ลงสนาม'],
  ['ตั้งหลักปักฐาน', 'เก็บเกี่ยวผล', 'รวบรวมกำลัง', 'สร้างหลัก', 'ประคองตัว', 'มั่นคง'],
  ['ทะยานขึ้น', 'เบ่งบาน', 'สร้างตัว', 'ถึงจุดพีค', 'ผลิดอกออกผล', 'รุ่งเรือง'],
  ['ส่งต่อปัญญา', 'แบ่งปัน', 'ถ่ายทอด', 'ทิ้งมรดก', 'เมตตาธรรม', 'ภูมิปัญญา']
];

var PHASE_INSIGHT_POOLS = [
  // Phase 0: ตั้งรากฐาน (เด็ก/วัยรุ่น)
  ['วางรากฐานให้มั่นคง — ทุกก้าวเล็ก ๆ ในวันนี้คือเสาเข็มของอนาคต',
   'ช่วงเวลาสะสม — ไม่ต้องรีบร้อน สร้างฐานทีละก้อน',
   'ทุกสิ่งที่เรียนรู้ตอนนี้จะเป็นอาวุธในอนาคต — อย่าหยุดสำรวจ',
   'เมล็ดที่เพาะวันนี้จะเติบโตเป็นต้นไม้ใหญ่ — อดทนรดน้ำต่อไป'],
  // Phase 1: ค้นหาตน (วัยรุ่นตอนปลาย/20 ต้น)
  ['ฟังเสียงข้างใน — สิ่งที่คุณค้นหาไม่ได้อยู่ข้างนอก แต่อยู่ในตัวคุณเอง',
   'ทดลองและเรียนรู้ — ทุกความผิดพลาดคือแผนที่นำทาง',
   'ช่วงนี้คือสนามทดลองชีวิต — ลองให้มาก ล้มให้เป็น เรียนรู้ให้เร็ว',
   'ยิ่งรู้จักตัวเองเร็ว ยิ่งเลือกทางที่ใช่ได้เร็ว — อย่ากลัวการเปลี่ยนใจ'],
  // Phase 2: ทดสอบโลก (20 ปลาย/30 ต้น)
  ['โลกกำลังทดสอบคุณ — ทุกอุปสรรคคือแบบฝึกหัดให้คุณแข็งแกร่งขึ้น',
   'อย่ากลัวการแข่งขัน — มันคือโอกาสให้คุณเติบโต',
   'ช่วงนี้อาจเหนื่อย แต่ทุกก้าวที่เดินกำลังสร้างเส้นทางที่ชัดเจนขึ้น',
   'ถ้ารู้สึกท้อ แปลว่าคุณกำลังออกจาก Comfort Zone — นั่นคือสัญญาณที่ดี',
   'ทุกคนที่ประสบความสำเร็จต้องผ่านช่วง "ลองเชิง" มาก่อน — คุณกำลังมาถูกทาง'],
  // Phase 3: ตั้งหลักปักฐาน (30 กลาง/40)
  ['ถึงเวลาตั้งหลัก — สิ่งที่คุณสร้างไว้กำลังเริ่มออกดอก',
   'รวบรวมสิ่งที่เรียนรู้ — แล้วต่อยอดให้มั่นคง',
   'ช่วงนี้คือจุดเปลี่ยนสำคัญ — สิ่งที่คุณตัดสินใจตอนนี้จะกำหนดทศวรรษหน้า',
   'ถ้ารู้สึกว่าชีวิต "ทรงตัว" ไม่ได้แปลว่าไม่ก้าวหน้า — แต่แปลว่าคุณกำลังสะสมพลัง',
   'ลงทุนกับตัวเองตอนนี้ — ทั้งทักษะ สุขภาพ และความสัมพันธ์ จะงอกเงยใน 5-10 ปีข้างหน้า'],
  // Phase 4: ทะยาน/เบ่งบาน (40 ปลาย/50-60)
  ['นี่คือช่วงเวลาของคุณ — เตรียมพร้อม ทุกสิ่งกำลังเข้าที่',
   'เชื่อมั่นในเส้นทาง — คุณเดินมาไกล และกำลังถึงจุดเปลี่ยนสำคัญ',
   'ผลลัพธ์จากความพยายามที่ผ่านมาจะปรากฏชัดเจน — เก็บเกี่ยวให้เต็มที่',
   'ช่วงนี้คือ "ปีทอง" ของชีวิต — ทั้งปัญญา ประสบการณ์ และโอกาสมาบรรจบกัน',
   'สิ่งที่เคยยากจะง่ายขึ้น — เพราะคุณมีทั้งฝีมือและภูมิปัญญาที่สะสมมา'],
  // Phase 5: ส่งต่อ/ภูมิปัญญา (60+)
  ['สิ่งที่คุณรู้คือของขวัญ — ถึงเวลาแบ่งปันให้คนรุ่นหลัง',
   'มองกลับไปด้วยความภูมิใจ — แล้วส่งต่อคบไฟให้ผู้อื่น',
   'ชีวิตไม่ได้วัดแค่ความสำเร็จ แต่วัดด้วยสิ่งที่คุณทิ้งไว้ให้โลก',
   'ทุกวันคือกำไร — ใช้เวลาที่เหลืออยู่กับสิ่งที่มีความหมายจริง ๆ',
   'คุณคือคลังปัญญาที่มีชีวิต — คนรอบข้างโชคดีที่มีคุณ']
];

/**
 * คำนวณกราฟชีวิตแบบเต็ม — MAIN EXPORT
 * 
 * @param {number} birthDay - วันที่เกิด (1-31)
 * @param {number} birthMonth - เดือนเกิด (1-12)
 * @param {number} birthYearBE - ปีเกิด พ.ศ. (เช่น 2533)
 * @param {number} ageY - อายุปัจจุบัน (ปี)
 * @param {object} p - planet object (สำหรับ color/symbol/element)
 * @returns {object} graph data for rendering
 */
function buildPersonalLifeGraphV2(birthDay, birthMonth, birthYearBE, ageY, p) {
  var birthYearCE = birthYearBE - 543;
  var lifePath = calculateLifePath(birthDay, birthMonth, birthYearCE);
  var pivotAges = buildPivotAges(lifePath, birthDay, birthMonth, birthYearBE);
  var el = (p && p.el) || 'ดิน';
  
  // Build phases from pivot ages
  var phases = [];
  var prevAge = 0;
  for (var i = 0; i < pivotAges.length; i++) {
    var labelPool = PHASE_LABEL_POOLS[i] || PHASE_LABEL_POOLS[0];
    var insightPool = PHASE_INSIGHT_POOLS[i] || PHASE_INSIGHT_POOLS[0];
    var idx = (birthDay + i) % labelPool.length;
    var insightIdx = (birthDay + i) % insightPool.length;
    
    phases.push({
      from: prevAge,
      to: pivotAges[i],
      label: labelPool[idx],
      insight: insightPool[insightIdx],
      energy: calculateEnergyAtAge(Math.floor((prevAge + pivotAges[i]) / 2), lifePath, birthDay, birthMonth, birthYearBE)
    });
    prevAge = pivotAges[i];
  }
  // Final phase (วัย 70+): ใช้ 88 เป็นเพดานเชิงภาพ ไม่โชว์ 99/∞ ให้ดูห่างเกินจริง
  var finalIdx = (birthDay + 5) % PHASE_LABEL_POOLS[5].length;
  phases.push({
    from: prevAge,
    to: 88,
    label: PHASE_LABEL_POOLS[5][finalIdx],
    insight: PHASE_INSIGHT_POOLS[5][finalIdx % PHASE_INSIGHT_POOLS[5].length],
    energy: calculateEnergyAtAge(prevAge + 5, lifePath, birthDay, birthMonth, birthYearBE)
  });
  
  // Add energy label/color to each phase
  for (var j = 0; j < phases.length; j++) {
    var elInfo = getEnergyLabel(phases[j].energy);
    phases[j].level = elInfo.level;
    phases[j].icon = elInfo.icon;
    phases[j].color = elInfo.color;
    phases[j].cssClass = elInfo.cssClass;
  }
  
  // Find current phase
  var currentPhase = 0;
  for (var k = 0; k < phases.length; k++) {
    if (ageY >= phases[k].from && ageY < phases[k].to) {
      currentPhase = k;
      break;
    }
  }
  
  // Progress within current phase
  var cp = phases[currentPhase];
  var phaseSpan = cp.to - cp.from;
  var progress = phaseSpan > 0 ? Math.min(100, Math.round(((ageY - cp.from) / phaseSpan) * 100)) : 50;
  
  // Next pivot age
  var nextPivotAge = null;
  var yearsToNext = null;
  if (currentPhase < phases.length - 1) {
    nextPivotAge = phases[currentPhase + 1].from;
    yearsToNext = nextPivotAge - ageY;
  }
  
  // Current year energy
  var currentEnergy = calculateEnergyAtAge(ageY, lifePath, birthDay, birthMonth, birthYearBE);
  var currentLabel = getEnergyLabel(currentEnergy);
  
  return {
    phases: phases,
    currentPhase: currentPhase,
    currentAge: ageY,
    progress: progress,
    element: el,
    lifePath: lifePath,
    birthDay: birthDay,
    birthMonth: birthMonth,
    birthYearBE: birthYearBE,
    planetName: p ? p.n : '',
    planetSymbol: p ? p.s : '',
    planetColor: p ? p.c : '#C9A227',
    pivotAges: pivotAges,
    nextPivotAge: nextPivotAge,
    yearsToNext: yearsToNext,
    currentEnergy: currentEnergy,
    currentLevel: currentLabel.level,
    currentIcon: currentLabel.icon,
    currentColor: currentLabel.color,
    insight: cp.insight,
    phaseLabel: cp.label
  };
}

/**
 * สร้าง HTML สำหรับแสดงกราฟชีวิต
 */
function buildLifeGraphHtmlV2(graph) {
  var html = '<div class="life-graph-card">'
    + '<div class="lg-header">'
    + '<span class="lg-planet" style="color:' + graph.planetColor + '">' + graph.planetSymbol + '</span>'
    + '<div><div class="lg-title">✦ กราฟชีวิตเฉพาะบุคคล ✦</div>'
    + '<div class="lg-subtitle">จุดเปลี่ยนชีวิตคำนวณจากเลขชีวิต ' + graph.lifePath + ' · เกิด ' + graph.birthDay + '/' + graph.birthMonth + '/' + graph.birthYearBE + '</div></div>'
    + '</div>';

  // Current year badge
  html += '<div class="lg-current-badge" style="border-color:' + graph.currentColor + '">'
    + '<span class="lg-current-icon">' + graph.currentIcon + '</span>'
    + '<span class="lg-current-level" style="color:' + graph.currentColor + '">' + graph.currentLevel + '</span>'
    + '<span class="lg-current-detail">อายุ ' + graph.currentAge + ' ปี · Energy ' + graph.currentEnergy + '/100</span>'
    + '</div>';

  // Phase labels above bars
  html += '<div class="lg-phase-labels">';
  for (var i = 0; i < graph.phases.length; i++) {
    var ph = graph.phases[i];
    var isCurrent = (i === graph.currentPhase);
    var labelClass = isCurrent ? ' lg-phase-current' : '';
    html += '<span class="lg-phase-label' + labelClass + '">'
      + ph.icon + ' ' + ph.label
      + '<small>' + ph.from + '–' + (ph.to >= 88 ? '88+' : ph.to) + '</small>'
      + '</span>';
  }
  html += '</div>';

  // Timeline bar
  html += '<div class="lg-timeline">';
  for (var i2 = 0; i2 < graph.phases.length; i2++) {
    var ph2 = graph.phases[i2];
    var isCurrent2 = (i2 === graph.currentPhase);
    var barClass2 = isCurrent2 ? ' lg-bar-current' : '';
    var barStyle2 = 'background:' + ph2.color + ';height:' + (18 + ph2.energy * 0.35) + 'px';
    html += '<div class="lg-bar' + barClass2 + ' ' + ph2.cssClass + '" style="' + barStyle2 + '">';
    if (isCurrent2 && graph.nextPivotAge) {
      html += '<span class="lg-marker">▼ ' + graph.currentAge + ' ปี (อีก ' + graph.yearsToNext + ' ปี)</span>';
    }
    html += '</div>';
  }
  html += '</div>';

  // Age labels below
  html += '<div class="lg-ages">';
  for (var j = 0; j < graph.phases.length; j++) {
    html += '<span>' + graph.phases[j].from + '</span>';
  }
  html += '<span>88+</span>';
  html += '</div>';

  // Current phase insight
  html += '<div class="lg-insight-card">'
    + '<div class="lg-insight-label">' + graph.currentIcon + ' ช่วงนี้: ' + graph.phaseLabel + ' (' + graph.currentLevel + ')</div>'
    + '<p class="lg-insight-text">' + graph.insight + '</p>';

  if (graph.nextPivotAge) {
    var nearText = graph.yearsToNext > 15
      ? 'โฟกัส 5 ปีข้างหน้าก่อน — ไม่ต้องรอจุดไกล'
      : 'อีก <strong>' + graph.yearsToNext + '</strong> ปี';
    html += '<div class="lg-next-pivot">จุดเปลี่ยนถัดไปที่อายุ <strong>' + graph.nextPivotAge + '</strong> ปี (' + nearText + ')</div>';
  }

  html += '</div>';

  return html;
}

// ===== LIFE DOMAIN FORECAST V2 — เชื่อมโยงกับ Life Graph =====

/**
 * คำนวณ domain score (0-100) สำหรับแต่ละด้านของชีวิต
 * ใช้ composite จาก life path + day + month + domain-specific seed
 * ทำให้แต่ละ domain ได้คะแนนต่างกัน แม้เป็นคนเดียวกัน
 */
function calculateDomainScore(age, lifePath, day, month, domainSeed, graphData) {
  // Base from Life Graph current energy with domain offset
  var offset = domainSeed * 7; // 0, 7, 14, 21, 28, 35
  var seed = lifePath * 1000 + day * 100 + month * 10 + domainSeed + Math.floor(age / 5);
  var noise = seededRandom(seed) * 30 - 15; // -15 to +15
  var base = (graphData && graphData.currentEnergy) ? graphData.currentEnergy : 55;
  return Math.round(Math.max(5, Math.min(100, base + noise)));
}

// Domain-specific content pools (ภาษาไทย)
var DOMAIN_CONTENT = {
  luck: {
    name: 'โชค / จังหวะโอกาส',
    icon: '✦',
    high: {
      current: ['จังหวะโชคลอยและลาภลอยกำลังเปิดจากโอกาสเล็ก ๆ ที่คนอื่นมองข้าม — ช่วงนี้สัญชาตญาณของคุณแม่นเป็นพิเศษ',
                'จักรวาลกำลังส่งสัญญาณผ่านตัวเลขและเหตุบังเอิญ — เปิดตาเปิดใจให้กว้าง โอกาสมาในรูปแบบที่คุณคาดไม่ถึง',
                'ดวงด้านโชคกำลังขึ้น — สิ่งที่คุณคิดว่า "บังเอิญ" อาจไม่ใช่เรื่องบังเอิญ แต่คือจังหวะที่ดาวจัดมาให้'],
      warning: ['อย่าโลภ — โชคดีมักมาเมื่อคุณไม่คาดหวัง', 'อย่าบอกใครก่อนโชคจะมาถึงมือ', 'เสี่ยงพอประมาณ อย่าทุ่มหมดตัว'],
      remedy: ['ตั้งงบเสี่ยงโชคที่เสียได้จริง', 'จดบันทึกเลขหรือสัญญาณที่เจอซ้ำ', 'ใช้เลขมงคลเสริมแต่ไม่ยึดติด']
    },
    mid: {
      current: ['จังหวะโชคช่วงนี้อยู่ในระดับกลาง — ยังไม่ใช่ช่วงพีคแต่ก็ไม่แย่ ใช้เวลานี้สะสมความรู้และรอจังหวะ',
               'โชคลาภอาจมาแบบเงียบ ๆ ไม่หวือหวา แต่มั่นคง — อย่ามองข้ามโอกาสเล็ก ๆ ที่ดูธรรมดา'],
      warning: ['อย่าใจร้อนรอลุ้นรวยทางลัด', 'ไม่ควรกู้เงินมาเสี่ยงโชคเด็ดขาด'],
      remedy: ['ศึกษาข้อมูลก่อนเสี่ยง', 'ใช้เวลาเรียนรู้รูปแบบโชคของตัวเอง', 'ออมก่อนเสี่ยง']
    },
    low: {
      current: ['ช่วงนี้ดวงโชคยังไม่เปิดเต็มที่ — อย่าฝืน ใช้เวลาเก็บแรงและสร้างฐานให้มั่นคงก่อน',
               'ดาวเตือนว่าช่วงนี้ควรระวังเรื่องการพนันและเสี่ยงโชค — โอกาสแพ้มีมากกว่าชนะ'],
      warning: ['ห้ามเล่นการพนันโดยเด็ดขาด', 'อย่าเชื่อคำชวนลงทุนที่ฟังดูดีเกินจริง', 'ระวังถูกหลอกเรื่องหวยหรือเลขเด็ด'],
      remedy: ['ออมเงินแทนการเสี่ยง', 'ทำบุญเสริมดวง', 'ฝึกสติก่อนตัดสินใจเรื่องเงิน']
    }
  },
  money: {
    name: 'การเงิน / ทรัพย์สิน',
    icon: '💰',
    high: {
      current: ['กระแสการเงินกำลังไหลดี — รายได้จากหลายทางเริ่มก่อตัว ช่วงนี้เหมาะวางแผนลงทุนระยะยาว',
                'ดาวการเงินส่องสว่าง — ทรัพย์สินที่มีอยู่เริ่มงอกเงย ถึงเวลาเก็บเกี่ยวผลจากการอดทนที่ผ่านมา'],
      warning: ['อย่าเพิ่งขยายกิจการใหญ่เกินตัว', 'แบ่งเงินสำรองไว้ก่อนลงทุน', 'ระวังคนขอยืมเงิน'],
      remedy: ['แบ่งเงินเป็น 3 กอง: ใช้จ่าย / ออม / ลงทุน', 'ปรึกษาผู้รู้ก่อนตัดสินใจเรื่องใหญ่', 'จดบันทึกรายรับรายจ่าย']
    },
    mid: {
      current: ['สถานะการเงินอยู่ในช่วงทรงตัว — ไม่ถึงกับขาดแคลนแต่ยังไม่รุ่งเรือง ถึงเวลาจัดระเบียบการเงินใหม่',
               'รายรับรายจ่ายพอดีกัน — ยังไม่มีเงินเหลือเก็บมาก แต่ก็ไม่มีหนี้สินหนักหน่วง'],
      warning: ['ระวังรายจ่ายไม่จำเป็น', 'อย่ากู้หนี้เพื่อซื้อของฟุ่มเฟือย'],
      remedy: ['ทำงบการเงินส่วนตัว', 'ลดรายจ่ายที่ไม่จำเป็น 10%', 'เริ่มออมอัตโนมัติทุกเดือน']
    },
    low: {
      current: ['ช่วงนี้ต้องรัดเข็มขัด — กระแสเงินกำลังตึงมือ แต่ไม่ถาวร ผ่านช่วงนี้ไปได้ด้วยวินัย',
               'ดาวเตือนเรื่องการเงิน — รายจ่ายอาจมากกว่ารายรับ ต้องใช้จ่ายอย่างมีสติ'],
      warning: ['ห้ามก่อหนี้เพิ่มโดยไม่จำเป็น', 'อย่าเซ็นค้ำประกันให้ใคร', 'เลี่ยงการลงทุนที่หวังผลเร็ว'],
      remedy: ['ตัดรายจ่ายฟุ่มเฟือยทันที', 'หาช่องทางเพิ่มรายได้เสริม', 'เจรจาประนอมหนี้ถ้ามี']
    }
  },
  health: {
    name: 'สุขภาพ / พลังชีวิต',
    icon: '🫀',
    high: {
      current: ['พลังชีวิตกำลังเปี่ยมล้น — ร่างกายแข็งแรง ภูมิต้านทานดี ช่วงนี้เหมาะเริ่มออกกำลังกายรูปแบบใหม่',
                'ดวงสุขภาพแจ่มใส — ทั้งกายและใจอยู่ในสมดุล ใช้ช่วงเวลานี้สร้างนิสัยสุขภาพดีติดตัว'],
      warning: ['อย่าหักโหมเกินไปเพราะคิดว่ายังไหว', 'พักผ่อนให้เพียงพอ อย่าอดนอน'],
      remedy: ['ออกกำลังกายสม่ำเสมอ', 'กินอาหารสดตามธาตุ', 'นอนให้ตรงเวลาอย่างน้อย 7 ชั่วโมง']
    },
    mid: {
      current: ['สุขภาพโดยรวมอยู่ในระดับพอใช้ — ไม่มีอะไรน่าห่วง แต่ก็ไม่ควรละเลยการดูแลตัวเอง',
               'พลังชีวิตอยู่ในระดับกลาง — อาจรู้สึกอ่อนล้าบ้างเป็นครั้งคราว แต่พักแล้วก็ฟื้น'],
      warning: ['อย่าละเลยอาการเล็ก ๆ น้อย ๆ', 'ระวังความเครียดสะสม'],
      remedy: ['ตรวจสุขภาพประจำปี', 'หาเวลาพักระหว่างวัน', 'ฝึกหายใจลึก 5 นาทีต่อวัน']
    },
    low: {
      current: ['ช่วงนี้ต้องดูแลสุขภาพเป็นพิเศษ — พลังชีวิตอาจตกต่ำ อย่าฝืนร่างกายจนเกินกำลัง',
               'ดวงสุขภาพเตือน — อาจมีอาการเจ็บป่วยเล็กน้อย หรือความอ่อนล้าที่สะสมมานาน'],
      warning: ['หากมีอาการผิดปกติควรรีบพบแพทย์', 'อย่าละเลยการพักผ่อน', 'ระวังอุบัติเหตุ'],
      remedy: ['พักผ่อนให้มากกว่าปกติ', 'กินอาหารเสริมภูมิต้านทาน', 'ทำสมาธิลดความเครียด']
    }
  },
  relationship: {
    name: 'ความสัมพันธ์ / คู่ครอง',
    icon: '♡',
    high: {
      current: ['ดาวความรักส่องสว่าง — ความสัมพันธ์กำลังไปได้ดี ทั้งคนโสดและคนมีคู่จะรู้สึกถึงพลังบวกจากคนรอบข้าง',
                'ช่วงเวลาแห่งความเข้าใจ — คุณและคนรอบตัวสื่อสารกันได้ลึกซึ้งขึ้น ความขัดแย้งเก่า ๆ จะคลี่คลาย'],
      warning: ['อย่าละเลยคนใกล้ชิดเพราะมัวสนใจคนใหม่', 'รักษาสัญญาที่ให้ไว้'],
      remedy: ['ใช้เวลาคุณภาพกับคนรัก', 'พูดคำขอบคุณและขอโทษเมื่อควร', 'เปิดใจฟังโดยไม่ตัดสิน']
    },
    mid: {
      current: ['ความสัมพันธ์อยู่ในภาวะปกติ — ไม่มีปัญหารุนแรงแต่ก็อาจรู้สึกห่างเหิน ใช้เวลาทบทวนและปรับปรุง',
               'ช่วงกลาง ๆ ของดวงความรัก — ถ้าโสด อาจยังไม่เจอคนที่ใช่ ถ้ามีคู่ อาจต้องเพิ่มความใส่ใจ'],
      warning: ['อย่าปล่อยให้ระยะห่างกลายเป็นระยะห่าง', 'ระวังคำพูดที่อาจทำร้ายโดยไม่ตั้งใจ'],
      remedy: ['นัดเดทหรือใช้เวลาด้วยกัน', 'เขียนสิ่งที่ชื่นชมในตัวอีกฝ่าย', 'พูดความรู้สึกตรง ๆ อย่างนุ่มนวล']
    },
    low: {
      current: ['ช่วงนี้ต้องระวังความสัมพันธ์ — อาจมีความขัดแย้งหรือความเข้าใจผิด ใจเย็นให้มากกว่าปกติ',
               'ดาวเตือนด้านความรัก — อย่าตัดสินใจเรื่องใหญ่ทางอารมณ์ เช่น การเลิกหรือการแต่งงาน'],
      warning: ['อย่าพูดตอนกำลังโกรธ', 'หลีกเลี่ยงการตัดสินคนอื่นจากคำบอกเล่า', 'ไม่ควรเริ่มความสัมพันธ์ใหม่ตอนนี้'],
      remedy: ['ฝึกสติก่อนตอบโต้', 'ขอคำปรึกษาจากผู้ใหญ่ที่ไว้ใจ', 'เขียนจดหมายระบายก่อนพูด']
    }
  },
  career: {
    name: 'การงาน / ความก้าวหน้า',
    icon: '◈',
    high: {
      current: ['ดาวการงานกำลังขึ้น — โอกาสก้าวหน้าและโปรเจกต์ใหม่ ๆ กำลังเข้ามา ถึงเวลาแสดงศักยภาพอย่างเต็มที่',
                'ช่วงเวลาทองของอาชีพ — สิ่งที่คุณทำอยู่กำลังได้รับการยอมรับ อย่ากลัวที่จะรับความท้าทายใหม่'],
      warning: ['อย่าลืมให้เครดิตทีม', 'ระวังการเมืองในที่ทำงาน', 'อย่ารับงานมากเกินจนทำไม่ไหว'],
      remedy: ['อัปเดตพอร์ตโฟลิโอ', 'เรียนรู้ทักษะใหม่ที่ตลาดต้องการ', 'สร้างเครือข่ายกับคนในสายงาน']
    },
    mid: {
      current: ['การงานทรงตัว — ไม่มีอะไรหวือหวาแต่ก็มั่นคง ช่วงนี้เหมาะกับการพัฒนาทักษะมากกว่าการหางานใหม่',
               'เส้นทางอาชีพอยู่ในช่วงปกติ — ยังไม่ถึงจังหวะเปลี่ยนงานใหญ่ แต่ก็ไม่ใช่ช่วงที่ควรอยู่นิ่ง'],
      warning: ['อย่าชะล่าใจคิดว่าปลอดภัย', 'อย่าหยุดเรียนรู้เพราะคิดว่าเก่งพอแล้ว'],
      remedy: ['ตั้งเป้าหมายอาชีพ 1-3 ปี', 'หา mentor หรือคนแนะนำ', 'พัฒนาจุดอ่อนที่รู้ตัว']
    },
    low: {
      current: ['ช่วงนี้ต้องอดทนกับงาน — อาจมีอุปสรรค การเปลี่ยนแปลง หรือความไม่แน่นอน เก็บประสบการณ์ไว้ให้มาก',
               'ดาวเตือนด้านอาชีพ — ระวังความขัดแย้งกับหัวหน้าหรือเพื่อนร่วมงาน ใจเย็นไว้ก่อน'],
      warning: ['อย่าลาออกโดยยังไม่มีที่ใหม่', 'ระวังการเซ็นสัญญาที่ไม่รอบคอบ', 'อย่าทะเลาะกับหัวหน้า'],
      remedy: ['อัปเดตเรซูเม่ไว้', 'เก็บเงินสำรองเผื่อฉุกเฉิน', 'ปรึกษาคนที่มีประสบการณ์มากกว่า']
    }
  },
  supporters: {
    name: 'บริวาร / ผู้สนับสนุน',
    icon: '♟',
    high: {
      current: ['ดาวบริวารส่องสว่าง — จะมีผู้ใหญ่หรือคนในทีมคอยช่วยเหลือ สนับสนุนความคิดของคุณ',
                'ช่วงเวลาที่คนรอบข้างพร้อมช่วย — อย่าลังเลที่จะขอความช่วยเหลือ เพราะคนที่ใช่จะเข้ามาเอง'],
      warning: ['อย่าลืมตอบแทนน้ำใจ', 'ระวังคนที่หวังผลประโยชน์แอบแฝง'],
      remedy: ['แสดงความขอบคุณอย่างจริงใจ', 'ช่วยเหลือผู้อื่นเมื่อมีโอกาส', 'สร้างทีมที่ไว้ใจได้']
    },
    mid: {
      current: ['บริวารอยู่ในระดับกลาง — มีคนช่วยบ้างแต่ไม่มาก ต้องพึ่งพาตัวเองเป็นหลัก',
               'ความสัมพันธ์กับทีมและผู้สนับสนุนอยู่ในภาวะปกติ — ไม่มีปัญหาอะไรเป็นพิเศษ'],
      warning: ['อย่าคาดหวังให้ใครมาช่วยตลอด', 'ระวังการพึ่งพาคนอื่นมากเกินไป'],
      remedy: ['สร้างเครือข่ายใหม่ ๆ', 'เป็นผู้ให้ก่อนเป็นผู้รับ', 'รักษาความสัมพันธ์เดิมไว้']
    },
    low: {
      current: ['ช่วงนี้ต้องระวังเรื่องบริวาร — อาจมีคนผิดสัญญา ทรยศ หรือปล่อยให้คุณเผชิญปัญหาคนเดียว',
               'ดาวเตือนด้านผู้สนับสนุน — อย่าไว้ใจใครง่ายเกินไป ตรวจสอบให้ดีก่อนร่วมงาน'],
      warning: ['อย่าพึ่งพาคนอื่นมากเกินไป', 'ระวังการให้ข้อมูลสำคัญกับคนที่ยังไม่ไว้ใจได้'],
      remedy: ['ทำงานให้จบด้วยตัวเองก่อน', 'มีแผนสำรองเสมอ', 'เลือกคบคนที่มีความซื่อสัตย์']
    }
  }
};

var DHAMMA_REMEDY_CONTENT = {
  luck: {
    cause: 'รากเหตุของโชคติดขัดคือใจร้อน โลภ หรือหวังผลเร็วเกินเหตุ',
    fix: 'ให้ก่อน รับทีหลัง และไม่กู้เงินมาเสี่ยงโชค',
    boost: 'ทำทานเล็ก ๆ แล้วตั้งงบเสี่ยงโชคที่เสียได้จริง',
    practice: 'ภารกิจ 7 วัน: จดเลขที่เจอซ้ำ และทำทาน 1 ครั้งโดยไม่หวังผล'
  },
  money: {
    cause: 'รากเหตุของเงินรั่วคือใช้เงินตามอารมณ์และไม่เห็นตัวเลขจริง',
    fix: 'หยุดหนี้ฟุ่มเฟือย รู้ตัวก่อนจ่าย และแยกเงินจำเป็นก่อน',
    boost: 'แบ่งเงินเป็น ใช้ ออม ลงทุน แล้วทำทานจากกำไรไม่ใช่จากหนี้',
    practice: 'ภารกิจ 7 วัน: จดรายจ่ายทุกบาท แล้วตัดรายจ่ายรั่ว 1 อย่าง'
  },
  health: {
    cause: 'รากเหตุของพลังตกคือฝืนร่างกาย นอนน้อย และปล่อยใจเครียดนาน',
    fix: 'ไม่เบียดเบียนตัวเอง พักให้พอ และหยุดก่อนร่างกายพัง',
    boost: 'เดินเบา ๆ สมาธิสั้น ๆ และกินพอดีตามจังหวะร่างกาย',
    practice: 'ภารกิจ 7 วัน: นอนตรงเวลา ดื่มน้ำหลังตื่น และเดินวันละ 15 นาที'
  },
  relationship: {
    cause: 'รากเหตุของรักสะดุดคือวาจาเร็ว คาดหวังสูง และฟังกันไม่จบ',
    fix: 'พูดให้น้อยลง ฟังให้จบ และขอโทษก่อนเรื่องเล็กจะบานปลาย',
    boost: 'ให้เวลา คำชม และความปลอดภัยทางใจแก่คนสำคัญ',
    practice: 'ภารกิจ 7 วัน: ชมคนใกล้ตัววันละ 1 เรื่อง และงดตอบโต้ตอนโกรธ 10 นาที'
  },
  career: {
    cause: 'รากเหตุของงานติดคือผัดวัน ประมาท หรือทำงานโดยไม่ชัดว่าคุณค่าอยู่ตรงไหน',
    fix: 'ปิดงานค้างก่อนเริ่มงานใหม่ และรักษาคำพูดกับทีม',
    boost: 'เพิ่มทักษะ 1 อย่าง ส่งงานตรงเวลา และให้เครดิตคนที่ช่วย',
    practice: 'ภารกิจ 7 วัน: เคลียร์งานค้าง 1 ชิ้น และเรียนทักษะใหม่ 30 นาที'
  },
  supporters: {
    cause: 'รากเหตุของบริวารไม่หนุนคือคาดหวังมากกว่าการให้ หรือไว้ใจคนผิดจังหวะ',
    fix: 'เป็นผู้ให้ก่อน รักษาน้ำใจ และวางขอบเขตกับคนไม่น่าไว้ใจ',
    boost: 'ขอบคุณ ตอบแทนน้ำใจ และเลือกทำงานกับคนซื่อสัตย์',
    practice: 'ภารกิจ 7 วัน: ขอบคุณคนที่เคยช่วย 1 คน และช่วยใครสักคนโดยไม่หวังผล'
  }
};

function buildDhammaRemedy(key, score, element) {
  var base = DHAMMA_REMEDY_CONTENT[key] || DHAMMA_REMEDY_CONTENT.luck;
  var elementBoost = {
    'ไฟ': 'ธาตุไฟ: ลงมือไว แต่เช็กเจตนาก่อน',
    'ดิน': 'ธาตุดิน: ทำซ้ำเล็ก ๆ ให้มั่นคง',
    'ลม': 'ธาตุลม: พูดให้ชัด ฟังให้ครบ',
    'น้ำ': 'ธาตุน้ำ: ฟังใจ แต่อย่าให้อารมณ์นำ'
  };
  var urgency = score < 35
    ? ' เริ่มจากข้อเล็กที่สุดก่อน'
    : (score >= 60 ? ' ทำต่อเนื่องเพื่อให้ผลลัพธ์ชัดขึ้น' : ' ทำสม่ำเสมอแล้วจังหวะจะนิ่งขึ้น');

  return {
    cause: base.cause,
    fix: base.fix + urgency,
    boost: base.boost + ' · ' + (elementBoost[element] || 'เลือกทำสิ่งที่ควบคุมได้ก่อน'),
    practice: base.practice
  };
}

/**
 * สร้างข้อมูล Life Domain Forecast เฉพาะบุคคล
 * เชื่อมโยงกับ Life Graph V2 — แต่ละ domain ได้คะแนนและเนื้อหาต่างกันตามวันเกิด
 */
function buildLifeDomainForecastV2(birthDay, birthMonth, birthYearBE, ageY, p, lifeGraph) {
  var birthYearCE = birthYearBE - 543;
  var lifePath = calculateLifePath(birthDay, birthMonth, birthYearCE);
  var el = (p && p.el) || 'ดิน';
  
  var domainKeys = ['luck', 'money', 'health', 'relationship', 'career', 'supporters'];
  
  // Calculate scores for each domain
  var domainScores = {};
  for (var i = 0; i < domainKeys.length; i++) {
    domainScores[domainKeys[i]] = calculateDomainScore(ageY, lifePath, birthDay, birthMonth, i, lifeGraph);
  }
  
  // Build domain data with personalized content
  var domains = [];
  for (var d = 0; d < domainKeys.length; d++) {
    var key = domainKeys[d];
    var content = DOMAIN_CONTENT[key];
    var score = domainScores[key];
    var level = getEnergyLabel(score);
    
    // Select content pool based on score
    var pool;
    if (score >= 60) pool = content.high;
    else if (score >= 35) pool = content.mid;
    else pool = content.low;
    
    // Pick text using seed from birth data
    var currentIdx = (birthDay * (d + 1) + birthMonth) % pool.current.length;
    var warnIdx = (birthMonth * (d + 2) + lifePath) % pool.warning.length;
    var remedyIdx = (lifePath * (d + 3) + ageY) % pool.remedy.length;
    
    // Build age band opportunities from Life Graph pivot ages
    var opportunities = [];

    // FIRST: Add current-phase opportunity (what to do NOW)
    var currentPhaseInfo = null;
    if (lifeGraph && lifeGraph.phases && lifeGraph.currentPhase < lifeGraph.phases.length) {
      var cPhase = lifeGraph.phases[lifeGraph.currentPhase];
      var cPhaseNext = lifeGraph.currentPhase < lifeGraph.phases.length - 1
        ? lifeGraph.phases[lifeGraph.currentPhase + 1] : null;
      var yearsLeft = cPhaseNext ? (cPhaseNext.from - ageY) : null;

      // Current phase action pool — เฉพาะ domain
      var currentActions = {
        luck: ['สังเกตสัญญาณรอบตัว — ตัวเลข ความบังเอิญ หรือโอกาสเล็ก ๆ ที่คนอื่นมองข้าม',
               'ใช้สัญชาตญาณนำทาง — ช่วงนี้สิ่งที่ "รู้สึกว่าใช่" มักจะใช่จริง'],
        money: ['เริ่มจดบันทึกรายรับรายจ่าย — ข้อมูลคืออาวุธสำคัญในการจัดการเงิน',
                'ลดค่าใช้จ่ายเล็กน้อย 5-10% แล้วออมส่วนต่างไว้ — ทุกบาทมีค่า'],
        health: ['เริ่มออกกำลังกายเบา ๆ 30 นาที/วัน — ไม่ต้องหนัก แค่สม่ำเสมอ',
                 'นอนให้ครบ 7 ชั่วโมง — พลังชีวิตเริ่มจากการพักผ่อน'],
        relationship: ['แสดงความรู้สึกให้คนรอบข้างรู้ — อย่ารอ "จังหวะที่ใช่"',
                       'รับฟังมากขึ้น พูดน้อยลง — ความเข้าใจเริ่มจากการฟัง'],
        career: ['พัฒนาทักษะใหม่ 1 อย่างที่ตลาดต้องการ — เริ่มจากเรียนฟรีออนไลน์',
                 'สร้างเครือข่ายกับคนในสายงาน 2-3 คนต่อเดือน'],
        supporters: ['ขอบคุณคนที่ช่วยเหลือคุณ — น้ำใจเล็ก ๆ สร้างพันธมิตรที่ยิ่งใหญ่',
                     'เป็นผู้ให้ก่อนเป็นผู้รับ — คนรอบข้างจะจำสิ่งที่คุณทำให้']
      };
      var actionPool = currentActions[key] || currentActions.luck;
      var actionIdx = (birthDay + d + ageY) % actionPool.length;

      var phaseYears = cPhase.from + '–' + (cPhase.to >= 88 ? '88+' : cPhase.to) + ' ปี';
      var phaseYearsText = yearsLeft ? 'อีก ' + yearsLeft + ' ปีในช่วงนี้' : 'ช่วงปัจจุบัน';

      currentPhaseInfo = {
        ageRange: phaseYears,
        title: '✦ ช่วง ' + phaseYears,
        subtitle: phaseYearsText,
        text: actionPool[actionIdx],
        isCurrent: true,
        icon: '▸'
      };
    }

    // SECOND: Near-term age windows (current + next 10-15 years)
    // ไม่ดึง pivot ไกล ๆ เช่น 75–83/80 ปีมาโชว์ในช่องโอกาส เพราะทำให้ผู้ใช้หมดหวัง
    var nearWindows = [
      { start: ageY, end: Math.min(ageY + 5, 88), label: 'ตอนนี้–5 ปีข้างหน้า', isCurrent: true },
      { start: ageY + 5, end: Math.min(ageY + 10, 88), label: '5–10 ปีข้างหน้า', isCurrent: false },
      { start: ageY + 10, end: Math.min(ageY + 15, 88), label: '10–15 ปีข้างหน้า', isCurrent: false }
    ];

    for (var nw = 0; nw < nearWindows.length; nw++) {
      var win = nearWindows[nw];
      if (win.start >= 88 || win.end <= win.start) continue;

      var focusAge = Math.floor((win.start + win.end) / 2);
      var oppScore = calculateDomainScore(focusAge, lifePath, birthDay, birthMonth, d * 11 + nw, lifeGraph);
      var oppLevel = getEnergyLabel(oppScore);
      var oppPool = oppScore >= 60 ? content.high : (oppScore >= 35 ? content.mid : content.low);
      var oppIdx = (nw * birthMonth + birthDay + d) % oppPool.current.length;
      var prepPool = win.isCurrent
        ? ['ลงมือทีละเรื่องในสัปดาห์นี้ — ไม่ต้องรอจังหวะใหญ่',
           'เลือก 1 สิ่งที่ควบคุมได้ แล้วทำให้สม่ำเสมอก่อน']
        : (oppScore >= 60
          ? ['สะสมทักษะและคอนเนกชั่นไว้ — พอโอกาสมาจะคว้าได้ทัน',
             'เตรียมตัวให้พร้อม — จังหวะดี ๆ มักมาตอนที่คุณพร้อมแล้ว']
          : ['สร้างฐานให้แข็งแรง — ยิ่งพร้อมยิ่งผ่านอุปสรรคได้ง่าย',
             'เรียนรู้จากประสบการณ์ตอนนี้ — มันจะเป็นเกราะป้องกันในอนาคต']);
      var prepIdx = (nw + birthDay + d) % prepPool.length;

      opportunities.push({
        ageRange: win.start + '–' + win.end + ' ปี',
        title: win.label,
        text: oppLevel.icon + ' ' + oppLevel.level + ' — ' + oppPool.current[oppIdx],
        preparation: '💡 เตรียมตัวตอนนี้: ' + prepPool[prepIdx],
        score: oppScore,
        level: oppLevel.level,
        icon: oppLevel.icon,
        isCurrent: win.isCurrent
      });
    }
    
    domains.push({
      key: key,
      label: content.name,
      icon: content.icon,
      score: score,
      level: level.level,
      levelIcon: level.icon,
      levelColor: level.color,
      levelClass: level.cssClass,
      current: pool.current[currentIdx],
      warning: pool.warning[warnIdx],
      remedy: pool.remedy[remedyIdx],
      dhammaRemedy: buildDhammaRemedy(key, score, el),
      currentPhase: currentPhaseInfo,
      opportunities: opportunities
    });
  }
  
  // Element tone
  var elementTones = {
    'ไฟ': 'พลังไฟเปิดทางผ่านความกล้าและการลงมือทำ — อย่าคิดนานเกินไป',
    'ดิน': 'พลังดินสอนให้อดทนและค่อยเป็นค่อยไป — ทุกอย่างมีจังหวะของมัน',
    'ลม': 'พลังลมเปิดทางผ่านความคิดและการสื่อสาร — ไอเดียดี ๆ กำลังมา',
    'น้ำ': 'พลังน้ำสอนให้ฟังสัญชาตญาณ — อารมณ์คือเข็มทิศที่แม่นยำ'
  };
  
  // Current age range
  var currentAgeRange;
  if (lifeGraph && lifeGraph.phases && lifeGraph.currentPhase < lifeGraph.phases.length) {
    var cp = lifeGraph.phases[lifeGraph.currentPhase];
    currentAgeRange = cp.from + '–' + (cp.to >= 88 ? '88+' : cp.to) + ' ปี';
  } else {
    currentAgeRange = ageY + ' ปี';
  }
  
  return {
    title: 'คัมภีร์แก้ดวง 6 ด้าน',
    intro: 'อ่านสถานะตอนนี้ แก้เหตุ เสริมดวง และจังหวะ 15 ปีข้างหน้า — คำนวณเฉพาะบุคคลจากเลขชีวิต ' + lifePath + ' · ธาตุ' + el,
    elementSummary: elementTones[el] || elementTones['ดิน'],
    currentAgeRange: currentAgeRange,
    domains: domains
  };
}
