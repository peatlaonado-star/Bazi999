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
  
  // Algorithm: ใช้เลข 12 ตัวคำนวณจุดเปลี่ยน
  for (var i = 0; i < 6; i++) {
    // เอา 2 digits มาสร้าง pivot
    var a = digits12[i * 2] || digits12[i % digits12.length];
    var b = digits12[i * 2 + 1] || digits12[(i + 1) % digits12.length];
    var raw = a * 10 + b + lifePath * 2;
    
    // Clamp และทำให้ spread ดี
    var pivot = Math.min(80, Math.max(7, raw + i * 4));
    
    // Ensure strictly increasing
    if (i > 0 && pivot <= pivots[i - 1]) {
      pivot = pivots[i - 1] + 5 + (day % 7) + i;
    }
    
    // Don't exceed 80
    if (pivot > 80) pivot = 80;
    
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
  ['วางรากฐานให้มั่นคง — ทุกก้าวเล็ก ๆ ในวันนี้คือเสาเข็มของอนาคต', 'ช่วงเวลาสะสม — ไม่ต้องรีบร้อน สร้างฐานทีละก้อน'],
  ['ฟังเสียงข้างใน — สิ่งที่คุณค้นหาไม่ได้อยู่ข้างนอก แต่อยู่ในตัวคุณเอง', 'ทดลองและเรียนรู้ — ทุกความผิดพลาดคือแผนที่นำทาง'],
  ['โลกกำลังทดสอบคุณ — ทุกอุปสรรคคือแบบฝึกหัดให้คุณแข็งแกร่งขึ้น', 'อย่ากลัวการแข่งขัน — มันคือโอกาสให้คุณเติบโต'],
  ['ถึงเวลาตั้งหลัก — สิ่งที่คุณสร้างไว้กำลังเริ่มออกดอก', 'รวบรวมสิ่งที่เรียนรู้ — แล้วต่อยอดให้มั่นคง'],
  ['นี่คือช่วงเวลาของคุณ — เตรียมพร้อม ทุกสิ่งกำลังเข้าที่', 'เชื่อมั่นในเส้นทาง — คุณเดินมาไกล และกำลังถึงจุดเปลี่ยนสำคัญ'],
  ['สิ่งที่คุณรู้คือของขวัญ — ถึงเวลาแบ่งปันให้คนรุ่นหลัง', 'มองกลับไปด้วยความภูมิใจ — แล้วส่งต่อคบไฟให้ผู้อื่น']
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
    
    phases.push({
      from: prevAge,
      to: pivotAges[i],
      label: labelPool[idx],
      insight: insightPool[idx],
      energy: calculateEnergyAtAge(Math.floor((prevAge + pivotAges[i]) / 2), lifePath, birthDay, birthMonth, birthYearBE)
    });
    prevAge = pivotAges[i];
  }
  // Final phase (ถึง 99)
  var finalIdx = (birthDay + 5) % PHASE_LABEL_POOLS[5].length;
  phases.push({
    from: prevAge,
    to: 99,
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
      + '<small>' + ph.from + '–' + (ph.to >= 99 ? '∞' : ph.to) + '</small>'
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
  html += '<span>∞</span>';
  html += '</div>';

  // Current phase insight
  html += '<div class="lg-insight-card">'
    + '<div class="lg-insight-label">' + graph.currentIcon + ' ช่วงนี้: ' + graph.phaseLabel + ' (' + graph.currentLevel + ')</div>'
    + '<p class="lg-insight-text">' + graph.insight + '</p>';

  if (graph.nextPivotAge) {
    html += '<div class="lg-next-pivot">จุดเปลี่ยนถัดไปที่อายุ <strong>' + graph.nextPivotAge + '</strong> ปี (อีก <strong>' + graph.yearsToNext + '</strong> ปี)</div>';
  }

  html += '</div>';

  return html;
}
