// Individual reading renderer (Mode 0)
// Provides: buildDailyBrief, renderInd, go0, life timeline helpers
// Renderers extracted from app.js
// Shared helpers are loaded from js/reading-helpers.js.
function buildDailyBrief(p, dayOfWeek, personalColor) {
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var db = content && content.dailyBrief ? content.dailyBrief : null;
  if (!db) {
    db = {
      weekdayLabel: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
      weekdayDeity: ['-', '-', '-', '-', '-', '-', '-'],
      weekdayElement: ['-', '-', '-', '-', '-', '-', '-'],
      weekdayEnergy: ['พลังงานวันนี้: มีพลังงานดีสำหรับการเริ่มต้นใหม่'],
      weekdayFocus: ['โฟกัส: สิ่งที่สำคัญที่สุดวันนี้'],
      weekdayWarning: ['ระวัง: อย่ารีบตัดสินใจ'],
      weekdayAction: ['สิ่งที่ควรทำวันนี้: หยุดพักสักครู่']
    };
  }
  var label = db.weekdayLabel[dayOfWeek] || db.weekdayLabel[0];
  var deity = db.weekdayDeity[dayOfWeek] || db.weekdayDeity[0];
  var elName = db.weekdayElement[dayOfWeek] || db.weekdayElement[0];
  var energy = db.weekdayEnergy[dayOfWeek] || db.weekdayEnergy[0];
  var focus = db.weekdayFocus[dayOfWeek] || db.weekdayFocus[0];
  var warning = db.weekdayWarning[dayOfWeek] || db.weekdayWarning[0];
  var action = db.weekdayAction[dayOfWeek] || db.weekdayAction[0];
  var colorName = personalColor ? personalColor.name : '';
  var colorHex = personalColor ? personalColor.hex : '#C9A227';
  return { label: label, deity: deity, element: elName, energy: energy, colorName: colorName, colorHex: colorHex, focus: focus, warning: warning, action: action };
}



function maskWindfallNumber(number, index){
  var text = String(number || '00');
  if (index % 2 === 0) return text.charAt(0) + '●';
  return '●' + text.charAt(1);
}

function buildWindfallNumberHtml(number, index, premiumUnlocked){
  var fullNumber = escapeHTML(number);
  if (premiumUnlocked) return '<strong class="wfl-full-number">' + fullNumber + '</strong>';
  return '<strong class="wfl-mask-number">' + escapeHTML(maskWindfallNumber(number, index)) + '</strong>'
    + '<strong class="wfl-full-number" aria-hidden="true">' + fullNumber + '</strong>';
}

function maskWindfallText(text, luckyNumbers){
  var maskedText = String(text || '');
  luckyNumbers.forEach(function(number, index){
    maskedText = maskedText.split(number).join(maskWindfallNumber(number, index));
  });
  return maskedText;
}

function buildWindfallDetailHtml(guide, premiumUnlocked){
  var fullStepsHtml = guide.ritualSteps.map(function(step){ return '<li>' + escapeHTML(step) + '</li>'; }).join('');
  if (premiumUnlocked) return '<ol>' + fullStepsHtml + '</ol>';
  var maskedStepsHtml = guide.ritualSteps.map(function(step){
    return '<li>' + escapeHTML(maskWindfallText(step, guide.luckyNumbers)) + '</li>';
  }).join('');
  return '<ol class="wfl-mask-detail">' + maskedStepsHtml + '</ol>'
    + '<ol class="wfl-full-detail" aria-hidden="true">' + fullStepsHtml + '</ol>';
}

function buildWindfallLuckHtml(guide, premiumUnlocked){
  var html = '<div class="windfall-luck' + (premiumUnlocked ? '' : ' is-locked') + '">'
    + '<div class="wfl-kicker">หวย · ลอตเตอรี่ · ลาภลอย</div>'
    + '<div class="wfl-title">✦ ' + escapeHTML(guide.title) + ' ✦</div>'
    + '<div class="wfl-desc">' + escapeHTML(guide.subtitle) + '</div>'
    + '<div class="wfl-numbers"><span>เลขที่ควรลอง</span>'
    + guide.luckyNumbers.map(function(number, index){ return buildWindfallNumberHtml(number, index, premiumUnlocked); }).join('')
    + '</div>'
    + '<div class="wfl-grid">'
    + '<div class="wfl-box"><small>จังหวะเฮง</small><b>' + escapeHTML(guide.sacredTime) + '</b></div>'
    + '<div class="wfl-box"><small>ทิศเปิดโชค</small><b>' + escapeHTML(guide.direction) + '</b></div>'
    + '</div>'
    + '<div class="wfl-line"><strong>หวย / ลอตเตอรี่:</strong> ' + escapeHTML(guide.lotteryFocus) + '</div>'
    + '<div class="wfl-line"><strong>สัญญาณเลข:</strong> ' + escapeHTML(guide.omen) + '</div>'
    + '<div class="wfl-section"><strong>พิธีเปิดทางโชค</strong>'
    + buildWindfallDetailHtml(guide, premiumUnlocked)
    + '</div>'
    + '<div class="wfl-mantra"><span>คาถาเรียกโชค</span>“' + escapeHTML(guide.mantra) + '”</div>'
    + '<div class="wfl-avoid"><strong>กันโชครั่ว:</strong> ' + escapeHTML(guide.avoid) + '</div>';
  if (!premiumUnlocked) {
    html += buildPremiumLockOverlay(
      'ปลดล็อกสูตรลาภลอยเฉพาะตัว',
      'ดูเลขที่ควรลอง จังหวะซื้อหวย/ลอตเตอรี่ ทิศเปิดโชค คาถา และพิธีเสริมดวงแบบสายมูเต็มรูปแบบ'
    );
  }
  html += '</div>';
  return html;
}

function buildMonthlyLifeMapHtml(model, premiumUnlocked){
  var html = '<div class="monthly-life-map' + (premiumUnlocked ? '' : ' is-locked') + '">'
    + '<div class="mlm-kicker">แผนที่ชีวิตรายเดือน</div>'
    + '<div class="mlm-title">✦ ' + escapeHTML(model.title) + ' ✦</div>'
    + '<div class="mlm-summary"><strong>พลังงานหลักของเดือนนี้:</strong> ' + escapeHTML(model.elementFocus) + '</div>'
    + '<div class="mlm-grid">'
    + '<div class="mlm-pill"><span>โฟกัส</span>' + escapeHTML(model.elementFocus) + '</div>'
    + '<div class="mlm-pill"><span>วันที่ควรระวัง</span>' + escapeHTML(model.elementWarning) + '</div>'
    + '<div class="mlm-pill"><span>สิ่งที่ควรทำ</span>' + escapeHTML(model.elementAction) + '</div>'
    + '</div>';

  html += '<div class="mlm-section-title">' + (premiumUnlocked ? 'พรีวิว 5 ด้านเดือนนี้' : 'พรีวิว 5 ด้านประจำเดือน') + '</div><div class="mlm-domains">';
  model.domains.forEach(function(domain){
    html += '<div class="mlm-domain"><div class="mlm-domain-head"><span>' + escapeHTML(domain.icon) + '</span>' + escapeHTML(domain.label) + '</div>'
      + '<div class="mlm-score-row"><span>คะแนนความเด่น</span><strong>' + escapeHTML(String(domain.score || 0)) + '/100</strong></div>'
      + '<div class="mlm-score-bar"><i style="width:' + escapeHTML(String(domain.score || 0)) + '%"></i></div>'
      + '<p>' + escapeHTML(premiumUnlocked ? domain.forecast : domain.teaser) + '</p>'
      + '<div class="mlm-action"><strong>ควรทำ:</strong> ' + escapeHTML(domain.action || '') + '</div>'
      + (premiumUnlocked ? '<div class="mlm-goal">เป้าหมาย: ' + escapeHTML(domain.goal) + '</div>' : '')
      + '</div>';
  });
  html += '</div>';

  if (premiumUnlocked) {
    html += '<div class="mlm-section-title">ปฏิทินวันดีรายเดือน</div><div class="mlm-calendar">';
    model.calendarDays.forEach(function(day){
      html += '<div class="mlm-cal-day mlm-' + escapeHTML(day.tone) + '"><strong>' + day.day + '</strong><span>' + escapeHTML(day.label) + '</span></div>';
    });
    html += '</div>';

    html += '<div class="mlm-section-title">สรุปรายสัปดาห์ 4 สัปดาห์</div><div class="mlm-weeks">';
    model.weeklyBriefs.forEach(function(week){
      html += '<div class="mlm-week"><strong>' + escapeHTML(week.title) + '</strong><p>' + escapeHTML(week.brief) + '</p><span>' + escapeHTML(week.action) + '</span></div>';
    });
    html += '</div>';

    html += '<div class="mlm-section-title">ภารกิจเสริมดวง 7 วัน</div><div class="mlm-rituals">';
    model.rituals.forEach(function(ritual, index){
      html += '<div class="mlm-ritual"><span>Day ' + (index + 1) + '</span>' + escapeHTML(ritual) + '</div>';
    });
    html += '</div>';
  } else {
    html += buildPremiumLockOverlay(
      'ปลดล็อกแผนที่ชีวิตรายเดือนฉบับเต็ม',
      'ดูดวงรายเดือนครบทุกด้าน ปฏิทินวันดีทั้งเดือน สรุปรายสัปดาห์ และภารกิจส่วนตัวตลอด 7 วัน'
    );
  }

  html += '</div>';
  return html;
}

// ===== MODE 0: Individual =====
function go0(){
  var ds=document.getElementById('d0').value; if(!ds)return;
  var u=U(), PL2=getPL(), RA2=getRA();
  var nm=document.getElementById('n0').value||(u.pdef||'บุคคลนี้');
  var gd=document.getElementById('g0').value;
  var ts=document.getElementById('t0').value||'06:00';
  var bday = new Date(ds);
  var birthDay = bday.getDate();
  var birthMonth = bday.getMonth() + 1;
  var birthYearBE = bday.getFullYear() + 543;
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
    renderInd(nm,gd,ds,ts,p,r,l,ri,li,u, birthDay, birthMonth, birthYearBE);
  }, 3200);
}

// ===== PERSONALIZED LIFE GRAPH =====
// คำนวณกราฟชีวิตเฉพาะบุคคลจาก ดาวเจ้าชะตา + ธาตุ + อายุ
// แทนที่ LIFE_BANDS แบบเดิมที่เหมือนกันทุกคน
var PLANET_PIVOT_AGES = {
  'อาทิตย์': [21, 28, 35, 42, 56],
  'จันทร์':  [18, 25, 33, 40, 52],
  'อังคาร':  [20, 27, 32, 38, 45],
  'พุธ':    [17, 23, 30, 37, 44],
  'พฤหัสบดี':[24, 32, 40, 48, 60],
  'ศุกร์':  [22, 29, 36, 43, 55],
  'เสาร์':  [27, 35, 42, 49, 58],
  'ราหู':   [19, 26, 34, 41, 50],
  'เกตุ':   [19, 26, 34, 41, 50],
  'พระจันทร์': [18, 25, 33, 40, 52]
};

var LIFE_PHASE_LABELS = ['รากฐาน', 'ค้นหาตัวเอง', 'ทดสอบโลก', 'ตั้งหลัก', 'สร้างตัว', 'ส่งต่อ'];

function buildPersonalLifeGraph(p, ageY) {
  var pivotAges = PLANET_PIVOT_AGES[p.n] || PLANET_PIVOT_AGES['อาทิตย์'];
  var el = p.el || 'ดิน';

  // Build phases from pivot ages
  var phases = [];
  var prevAge = 0;
  for (var i = 0; i < pivotAges.length; i++) {
    phases.push({ from: prevAge, to: pivotAges[i], label: LIFE_PHASE_LABELS[i] || ('ช่วงที่ ' + (i+1)) });
    prevAge = pivotAges[i];
  }
  // Final phase
  phases.push({ from: prevAge, to: 99, label: LIFE_PHASE_LABELS[LIFE_PHASE_LABELS.length - 1] || 'ส่งต่อ' });

  // Element-based energy curve
  var energyCurves = {
    'ไฟ': [35, 70, 85, 65, 90, 75],
    'ดิน': [30, 45, 55, 65, 75, 85],
    'ลม': [40, 60, 50, 70, 55, 80],
    'น้ำ': [30, 55, 60, 75, 70, 90]
  };
  var curve = energyCurves[el] || energyCurves['ดิน'];

  // Assign energy to each phase
  for (var j = 0; j < phases.length; j++) {
    phases[j].energy = curve[j] || 50;
    phases[j].color = getEnergyColor(phases[j].energy);
  }

  // Find current phase
  var currentPhase = 0;
  for (var k = 0; k < phases.length; k++) {
    if (ageY >= phases[k].from && ageY < phases[k].to) {
      currentPhase = k;
      break;
    }
  }

  // Calculate progress within current phase (0-100%)
  var cp = phases[currentPhase];
  var phaseSpan = cp.to - cp.from;
  var progress = phaseSpan > 0 ? Math.min(100, Math.round(((ageY - cp.from) / phaseSpan) * 100)) : 50;

  // Element-specific current insight
  var elementInsights = {
    'ไฟ': ['พลังนำ — ใช้ความกล้าเปิดทาง แต่อย่าลืมฟังคนรอบตัว', 'จังหวะลุย — ถึงเวลาลงมือ แต่วางแผนก่อนพุ่ง', 'ช่วงพัก — ใช้เวลาฟื้นพลังก่อนลุยต่อ', 'หัวเลี้ยว — ตัดสินใจใหญ่รออยู่ ใจเย็น ๆ'],
    'ดิน': ['สร้างฐาน — มั่นคงทีละก้อน ไม่ต้องรีบ', 'ช่วงผลิดอก — สิ่งที่อดทนไว้กำลังผลิผล', 'ปรับดิน — ถึงเวลาเปลี่ยนวิธี ไม่ใช่เป้าหมาย', 'เก็บเกี่ยว — รับผลจากความเพียรที่ผ่านมา'],
    'ลม': ['เปิดรับ — ไอเดียใหม่กำลังมา เลือกให้ดี', 'สื่อสาร — คำพูดมีพลังกว่าที่คิด', 'โฟกัส — รวมพลังไปที่เรื่องเดียวให้จบ', 'กระจาย — ถึงเวลาต่อยอดสิ่งที่ทำสำเร็จ'],
    'น้ำ': ['ฟังใจ — สัญชาตญาณกำลังบอกอะไรบางอย่าง', 'ไหลตาม — อย่าฝืนธรรมชาติของจังหวะชีวิต', 'ลึกขึ้น — เข้าใจตัวเองในระดับที่ลึกกว่าเดิม', 'รวมพลัง — อารมณ์และเหตุผลประสานกัน']
  };
  var insights = elementInsights[el] || elementInsights['ดิน'];
  var insightIdx = currentPhase >= insights.length ? insights.length - 1 : currentPhase;
  var insight = insights[insightIdx];

  return {
    phases: phases,
    currentPhase: currentPhase,
    currentAge: ageY,
    progress: progress,
    element: el,
    planetName: p.n,
    planetSymbol: p.s,
    planetColor: p.c,
    insight: insight,
    phaseLabel: cp.label
  };
}

function getEnergyColor(energy) {
  if (energy >= 80) return '#4CAF50';
  if (energy >= 65) return '#8BC34A';
  if (energy >= 50) return '#FFC107';
  if (energy >= 35) return '#FF9800';
  return '#F44336';
}

function buildLifeGraphHtml(graph) {
  var html = '<div class="life-graph-card">'
    + '<div class="lg-header">'
    + '<span class="lg-planet" style="color:' + graph.planetColor + '">' + graph.planetSymbol + '</span>'
    + '<div><div class="lg-title">✦ กราฟชีวิตเฉพาะบุคคล ✦</div>'
    + '<div class="lg-subtitle">จุดเปลี่ยนชีวิตคำนวณจากดาว' + graph.planetName + ' · ธาตุ' + graph.element + '</div></div>'
    + '</div>';

  // Phase labels above bars
  html += '<div class="lg-phase-labels">';
  for (var i = 0; i < graph.phases.length; i++) {
    var ph = graph.phases[i];
    var isCurrent = (i === graph.currentPhase);
    var labelClass = isCurrent ? ' lg-phase-current' : '';
    html += '<span class="lg-phase-label' + labelClass + '">' + ph.label + '<small>' + ph.from + '</small></span>';
  }
  html += '</div>';

  // Timeline bar
  html += '<div class="lg-timeline">';
  for (var i2 = 0; i2 < graph.phases.length; i2++) {
    var ph2 = graph.phases[i2];
    var isCurrent2 = (i2 === graph.currentPhase);
    var barClass2 = isCurrent2 ? ' lg-bar-current' : '';
    var barStyle2 = 'background:' + ph2.color + ';height:' + (20 + ph2.energy * 0.3) + 'px';
    html += '<div class="lg-bar' + barClass2 + '" style="' + barStyle2 + '">';
    if (isCurrent2) {
      var nextPivot2 = (i2 + 1 < graph.phases.length) ? graph.phases[i2 + 1].from : 99;
      var yearsLeft2 = nextPivot2 - graph.currentAge;
      html += '<span class="lg-marker">▼ ' + graph.currentAge + ' ปี</span>';
    }
    html += '</div>';
  }
  html += '</div>';

  // Age labels below
  html += '<div class="lg-ages">';
  for (var j = 0; j < graph.phases.length; j++) {
    html += '<span>' + graph.phases[j].from + '</span>';
  }
  html += '<span>' + (graph.phases[graph.phases.length-1].to || 99) + '</span>';
  html += '</div>';

  // Current phase card
  var cp = graph.phases[graph.currentPhase];
  var nextPivotForDisplay = (graph.currentPhase + 1 < graph.phases.length) ? graph.phases[graph.currentPhase + 1].from : 99;
  var yearsToNext = nextPivotForDisplay - graph.currentAge;
  html += '<div class="lg-current">'
    + '<div class="lg-current-badge" style="background:' + cp.color + '">● ' + cp.label + ' · ' + cp.from + '–' + cp.to + ' ปี</div>'
    + '<div class="lg-current-age">ตอนนี้ ' + graph.currentAge + ' ปี → จุดเปลี่ยนถัดไปที่ ' + nextPivotForDisplay + ' ปี (อีก ' + yearsToNext + ' ปี)</div>'
    + '<div class="lg-insight">' + graph.insight + '</div>'
    + '</div>';

  // Element guide (1 line)
  html += '<div class="lg-element-tip">'
    + '<span style="color:' + graph.planetColor + '">✦</span> '
    + 'พลังธาตุ' + graph.element + 'ช่วงนี้: ' + getElementPhaseTip(graph.element, graph.currentPhase)
    + '</div>';

  html += '</div>';
  return html;
}

function getElementPhaseTip(element, phase) {
  var tips = {
    'ไฟ': ['เริ่มต้นด้วยความกล้า — แต่อย่าลืมตั้งหลักก่อนกระโดด', 'ไฟแรงไปถูกทาง — เลือกโฟกัสหนึ่งเรื่องแล้วลุย', 'เปลวไฟต้องพัก — ถอยก่อนเพื่อก้าวไกลกว่า'],
    'ดิน': ['ค่อยเป็นค่อยไป — ทีละก้อนสร้างฐานให้แข็งแรง', 'รากฐานเริ่มมั่น — ถึงเวลาขยายผลอย่างมั่นคง', 'เก็บเกี่ยวผลจากความอดทน — สิ่งที่ผ่านมาทั้งหมดกำลังออกดอก'],
    'ลม': ['เปิดรับทุกทิศทาง — แต่อย่ากระจัดกระจาย', 'จับทิศทางได้แล้ว — โฟกัสลมให้เป็นพลังเดียว', 'ใช้สายลมที่สะสม — พัดพาสิ่งที่สร้างไว้ให้กว้างไกล'],
    'น้ำ': ['เรียนรู้ที่จะไหล — อย่าฝืนธรรมชาติของตัวเอง', 'น้ำขึ้น — พลังอารมณ์และเหตุผลกำลังสมดุล', 'น้ำลึก — ความเข้าใจที่สะสมมาจะนำทางคุณ']
  };
  var elTips = tips[element] || tips['ดิน'];
  var idx = phase >= 3 ? 2 : (phase >= 2 ? 1 : 0);
  return elTips[idx];
}

// ===== OLD LIFE BANDS (เก็บไว้ให้ buildLifeTimeline ยังทำงานได้) =====
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

function wrapCollapsible(label, hint, content, startCollapsed) {
  var collapsedClass = startCollapsed ? ' collapsed' : '';
  return '<div class="collapsible-section' + collapsedClass + '">'
    + '<div class="section-toggle"><span class="section-toggle-arrow">▼</span><span class="section-toggle-label">' + label + '</span><span class="section-toggle-hint">' + hint + '</span></div>'
    + '<div class="section-body">' + content + '</div>'
    + '</div>';
}

function renderInd(nm,gd,ds,ts,p,r,l,ri,li,u, birthDay, birthMonth, birthYearBE){
  // Fallback for tests that don't pass birth data
  if (birthDay === undefined) {
    var _bday = new Date(ds);
    birthDay = _bday.getDate();
    birthMonth = _bday.getMonth() + 1;
    birthYearBE = _bday.getFullYear() + 543;
  }
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
  var premiumUnlocked = premiumIsUnlocked();


  // 1. ทักษาปกรณ์
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
  var thaksaHtml = '<strong class="hl-gold">✦ พรสวรรค์หนุนดวง :</strong><br>'
    + 'จุดแข็งที่จะเป็นแม่เหล็กดึงดูดความสำเร็จและสิริมงคลเข้ามาในชีวิตคุณคือ <span class="hl-purple">' + tk.sri + '</span> ยิ่งคุณใช้สิ่งนี้มากเท่าไหร่ เส้นทางของคุณจะยิ่งราบรื่นขึ้น<br><br>'
    + '<strong class="hl-gold">✦ เงาในใจที่ต้องก้าวข้าม :</strong><br>'
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
    + '<div style="text-align:center; font-size:11px; color:#7a6a9a; margin-bottom:20px; letter-spacing:0.05em;"></div>'
    + '<div class="ap-step"><div class="ap-num">1</div><div class="ap-content"><h4><span style="font-size:15px; margin-right:4px;">👁️</span> สติรับรู้</h4><p>เมื่อไหร่ก็ตามที่คุณเริ่มรู้สึกว่า <strong class="hl-purple">"' + tk.kala + '"</strong> กำลังก่อตัวขึ้น ให้ถือว่านั่นคือสัญญาณเตือนจากดวงดาว <span style="font-size:13px">🔔</span> อย่ากล่าวโทษตัวเอง แต่ให้รับรู้ว่าเงามืดกำลังพยายามเข้ามาควบคุมพวงมาลัยชีวิตคุณ</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">2</div><div class="ap-content"><h4><span style="font-size:15px; margin-right:4px;">🧭</span> ลงมือปรับจูน </h4><p><span class="hl-gold">✧</span> ' + p.wkfix + '<br><br><span class="hl-gold">✧</span> นอกจากนี้ กุญแจสำคัญของคนธาตุ' + p.el + 'คือ <strong>' + elementAction + '</strong> <span style="font-size:13px">⏳</span> เริ่มต้นทำสิ่งนี้ให้เป็นนิสัยใน 21 วันข้างหน้า</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">3</div><div class="ap-content"><h4><span style="font-size:15px; margin-right:4px;">🦋</span> ยกระดับจิตวิญญาณ </h4><p>เมื่อคุณปรับสมดุลข้อ 1 และ 2 ได้ พลังงานแห่งความขัดแย้งจะถูกเปลี่ยนเป็น <strong class="hl-gold">✨ ' + tk.sri + '</strong> โดยอัตโนมัติ คุณจะพบว่าผู้คน โอกาส และโชคลาภ <span style="font-size:13px">🕊️</span> จะถูกดึงดูดเข้ามาหาคุณอย่างเป็นธรรมชาติ เพราะฐานชีวิตคุณมั่นคงแล้ว</p></div></div>'
    + '<div class="ap-quote">"จุดอ่อนที่ถูกเยียวยา จะกลายเป็นจุดแข็งที่แข็งแกร่งที่สุดของคุณ <span style="font-style:normal">🤍</span>"</div>'
    + '</div>';

  // 3. พลังแห่งราศี
  var rasiHtml = '<strong class="hl-gold">✦ พลังแห่งราศี' + r.n + ' :</strong><br>'
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
  var powerTip = premiumUnlocked
    ? '<div class="pc-desc"><span class="hl-gold">เคล็ดลับ:</span> ใช้เลข <strong>' + pe.num + '</strong> ต่อท้ายชื่อไลน์/รหัสผ่าน และใช้สี <strong>' + pe.c1n + '/' + pe.c2n + '</strong> เป็นภาพพื้นหลังมือถือในวันสำคัญ เพื่อปรับคลื่นพลังงานดึงดูดความสำเร็จ</div>'
    : '<div class="pc-desc"><span class="hl-gold">ฟรี:</span> เลขและสีมงคลสำหรับแชร์หรือใช้เป็นแรงบันดาลใจประจำวัน · ปลดล็อกพรีเมียม เพื่อดูวิธีใช้เชิงลึก</div>';
  var powerCardHtml = '<div class="power-card">'
    + '<div class="pc-header"><span style="font-size:16px;">✨</span> พลังงานเสริมดวง</div>'
    + '<div class="pc-grid">'
    + '<div class="pc-item"><div class="pc-title">🔢 เลขขับเคลื่อนชีวิต</div><div class="pc-value">' + pe.num + '</div></div>'
    + '<div class="pc-item"><div class="pc-title">🎨 สีเสริมออร่า</div>'
    + '<div class="pc-colors">'
    + '<div class="pc-color-wrap"><div class="pc-color-dot" style="background:' + pe.c1 + ';"></div><div class="pc-color-name">' + pe.c1n + '</div></div>'
    + '<div class="pc-color-wrap"><div class="pc-color-dot" style="background:' + pe.c2 + ';"></div><div class="pc-color-name">' + pe.c2n + '</div></div>'
    + '</div></div>'
    + '</div>'
    + powerTip
    + '</div>' // ปิด power-card
    // ปุ่มเซฟรูปภาพถูกเอาออกตามคำขอผู้ใช้

  var karma = buildKarmaMirror(p, dayOfWeek);
  var karmaFull = '<div class="karma-card' + (premiumUnlocked ? '' : ' is-locked') + '">'
    + '<div class="karma-kicker">พิมพ์เขียวชีวิตไทย</div>'
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
  var karmaHtml = karmaFull;
  if (!premiumUnlocked) {
    karmaHtml = karmaFull.slice(0, -6) + buildPremiumLockOverlay(
      'ปลดล็อกกระจกกรรมเฉพาะตัว',
      'ดูแพตเทิร์นชีวิต บทเรียนของดาว เงาจากวันเกิด คำแนะนำรายเดือน และ ritual ส่วนตัว 7 วัน'
    ) + '</div>';
  }

  // ═══ Life Graph V2 — คำนวณก่อน ใช้ร่วมกับ Domain ═══
  var lifeGraph = buildPersonalLifeGraphV2(birthDay, birthMonth, birthYearBE, ageY, p);
  var lifeGraphHtml = buildLifeGraphHtmlV2(lifeGraph);

  // ═══ Life Domain Forecast V2 — เฉพาะบุคคล เชื่อม Life Graph ═══
  var domainMatrix = buildLifeDomainForecastV2(birthDay, birthMonth, birthYearBE, ageY, p, lifeGraph);
  var domainIntro = premiumUnlocked
    ? domainMatrix.intro
    : 'พรีวิวหัวข้อชีวิต 6 ด้านที่ STARVIA จะวิเคราะห์ให้ละเอียดในรีพอร์ตพรีเมียม';
  var domainHtml = '<div class="domain-matrix">'
    + '<div class="domain-kicker">วิเคราะห์เฉพาะบุคคล</div>'
    + '<div class="domain-title">✦ ' + escapeHTML(domainMatrix.title) + ' ✦</div>'
    + '<div class="domain-desc">' + escapeHTML(domainIntro) + '</div>'
    + '<div class="domain-element-tone">' + escapeHTML(domainMatrix.elementSummary) + '</div>'
    + '<div class="domain-current-chip">🎯 วัยปัจจุบัน: ' + escapeHTML(domainMatrix.currentAgeRange) + '</div>'
    + lifeGraphHtml
    + '<div class="domain-premium' + (premiumUnlocked ? '' : ' is-locked') + '">'
    + '<div class="domain-grid">';
  domainMatrix.domains.forEach(function(domain){
    domainHtml += '<div class="domain-card domain-' + escapeHTML(domain.key) + '">'
      // Header with score badge
      + '<div class="domain-head-v2">'
      + '<span class="domain-icon-v2">' + escapeHTML(domain.icon) + '</span>'
      + '<div class="domain-head-info">'
      + '<div class="domain-label-v2">' + escapeHTML(domain.label) + '</div>'
      + '</div>'
      + '<div class="domain-score-badge" style="background:' + escapeHTML(domain.levelColor) + '20;color:' + escapeHTML(domain.levelColor) + ';border:1px solid ' + escapeHTML(domain.levelColor) + '40">'
      + '<span>' + escapeHTML(domain.levelIcon) + '</span>'
      + '<span>' + escapeHTML(domain.level) + '</span>'
      + '<span>' + domain.score + '/100</span>'
      + '</div>'
      + '</div>'
      // Content sections
      + '<div class="domain-part"><strong>สถานการณ์ปัจจุบัน</strong><p>' + escapeHTML(domain.current) + '</p></div>'
      + '<div class="domain-part domain-warning"><strong>⚠️ สัญญาณเตือน</strong><p>' + escapeHTML(domain.warning) + '</p></div>'
      + '<div class="domain-part domain-remedy"><strong>✨ วิธีเสริมให้ดีขึ้น</strong><p>' + escapeHTML(domain.remedy) + '</p></div>'
      // Opportunities from Life Graph
      + '<div class="domain-part"><strong>📅 โอกาสตามช่วงอายุ</strong><div class="domain-ages">';
    domain.opportunities.forEach(function(opp){
      domainHtml += '<div class="domain-age-v2">'
        + '<span class="domain-age-chip" style="background:' + escapeHTML(opp.level === 'ปีทอง' ? '#FFD700' : opp.level === 'ปีดี' ? '#4CAF50' : opp.level === 'ปานกลาง' ? '#FFC107' : '#9E9E9E') + '20">' + escapeHTML(opp.ageRange) + '</span>'
        + '<p>' + escapeHTML(opp.text) + '</p>'
        + '</div>';
    });
    domainHtml += '</div></div>'
      + '</div>';
  });
  if (!premiumUnlocked) {
    domainHtml += '</div>' + buildPremiumLockOverlay(
      'ปลดล็อก แผนที่สถานการณ์ชีวิต',
      'วิเคราะห์ 6 ด้าน: โชค การเงิน สุขภาพ ความรัก การงาน และบริวาร พร้อมคำแนะนำแบบลงมือทำได้ — คำนวณเฉพาะบุคคลจากเลขชีวิตและวันเกิดของคุณ'
    );
  }
  domainHtml += '</div></div>';

  var monthlyLifeMap = buildMonthlyLifeMap(p, r, l, ds);
  var monthlyLifeMapHtml = buildMonthlyLifeMapHtml(monthlyLifeMap, premiumUnlocked);
  var windfallLuckGuide = buildWindfallLuckGuide(p, ds, dayOfWeek);
  var windfallLuckHtml = buildWindfallLuckHtml(windfallLuckGuide, premiumUnlocked);

  var briefData = buildDailyBrief(p, dayOfWeek, { name: pe.c1n, hex: pe.c1 });
  // กำลังวันประจำตัว — compact identity card
  var elementColors = { 'ไฟ': '#E8534A', 'น้ำ': '#5B9BD5', 'ลม': '#B8A8D8', 'ดิน': '#A0A060' };
  var ec = elementColors[briefData.element] || 'var(--g)';
  var cosmicBriefHtml = '<div class="weekday-power-card">'
    // Header badge — day + deity + element
    + '<div class="wpc-badge-row">'
    + '<div class="wpc-badge wpc-badge-day"><span class="wpc-badge-label">วันเกิด</span><span class="wpc-badge-value">' + briefData.label + '</span></div>'
    + '<div class="wpc-badge wpc-badge-deity"><span class="wpc-badge-label">เทวดาประจำวัน</span><span class="wpc-badge-value">' + briefData.deity + '</span></div>'
    + '<div class="wpc-badge wpc-badge-element" style="border-color:' + ec + '"><span class="wpc-badge-label">ธาตุ</span><span class="wpc-badge-value" style="color:' + ec + '">' + briefData.element + '</span></div>'
    + '</div>'
    // Title
    + '<div class="wpc-title">✦ กำลังวันประจำตัว ✦</div>'
    // Energy line — prominent
    + '<div class="wpc-energy">⚡ ' + briefData.energy + '</div>'
    // Color hint
    + '<div class="wpc-color-hint">🎨 สีมงคล: <strong style="color:' + briefData.colorHex + '">' + briefData.colorName + '</strong></div>'
    // Three action items in a compact row
    + '<div class="wpc-actions">'
    + '<div class="wpc-action"><span class="wpc-action-icon">🎯</span><span class="wpc-action-label">โฟกัส</span><p>' + briefData.focus + '</p></div>'
    + '<div class="wpc-action"><span class="wpc-action-icon">⚠️</span><span class="wpc-action-label">ระวัง</span><p>' + briefData.warning + '</p></div>'
    + '<div class="wpc-action"><span class="wpc-action-icon">🙏</span><span class="wpc-action-label">ปฏิบัติ</span><p>' + briefData.action + '</p></div>'
    + '</div>'
  + '</div>';

  // 5. ประกอบร่างการแสดงผล (Info + Power Elements + Radar)
  // Blueprint Header Card
  var blueprintCardHtml = '<div class="blueprint-card">'
    + '<div class="bp-kicker">พิมพ์เขียวชีวิตไทย</div>'
    + '<div class="bp-hero">'
    + '<div class="bp-planet-main">'
    + '<span class="bp-planet-symbol" style="color:' + p.c + '">' + p.s + '</span>'
    + '<div><div class="bp-label">ดาวเจ้าชะตา</div><div class="bp-title">' + p.n + ' · ธาตุ' + p.el + '</div></div>'
    + '</div>'
    + '<div class="bp-age-meta"><span>เจ้าของดวง</span><strong>✦ ' + nm + ' ✦</strong><small>' + ageTxt + '</small></div>'
    + '</div>'
    + '<div class="bp-axis-grid">'
    + '<div class="bp-axis-card"><span class="bp-axis-label">ตัวตนภายนอก</span><strong style="color:' + r.c + '">' + r.s + ' ' + r.n + '</strong><small>ราศีเกิดช่วยบอกโทนบุคลิกและแรงขับหลัก</small></div>'
    + '<div class="bp-axis-card"><span class="bp-axis-label">วิธีที่โลกมองเห็น</span><strong style="color:' + l.c + '">' + l.s + ' ' + l.n + '</strong><small>ลัคนาช่วยบอกภาพแรกที่คนอื่นสัมผัสได้</small></div>'
    + '</div>'
    + '<div class="bp-summary">พิมพ์เขียวนี้สรุปแรงขับเดิมของคุณก่อนอ่านดวงรายเดือน — อายุเป็นเพียงบริบทเสริม ไม่ใช่ตัวตัดสินดวงทั้งหมด</div>'
    + '</div>';

  var conversionRoadmapHtml = '<div class="conversion-roadmap">'
    + '<div class="cr-kicker">เริ่มอ่านตรงนี้</div>'
    + '<div class="cr-title">อ่านฟรีให้รู้สึกว่า “ตรง” แล้วค่อยไหลไปปลดล็อกส่วนที่อยากรู้ที่สุด</div>'
    + '<div class="cr-steps">'
    + '<div class="cr-step"><span>1</span><strong>พลังวันนี้</strong><small>ดูอารมณ์ สี และเลขที่ใช้ได้ทันที</small></div>'
    + '<div class="cr-step cr-hot"><span>2</span><strong>สูตรลาภลอย</strong><small>หัวข้อสายมูที่ล็อกไว้ให้กดซื้อ</small></div>'
    + '<div class="cr-step"><span>3</span><strong>แผนชีวิตรายเดือน</strong><small>เห็นภาพว่าพรีเมียมมีรายละเอียดแค่ไหน</small></div>'
    + '</div>'
    + '<button class="cr-cta" data-action="open-payment">ปลดล็อกรีพอร์ตฉบับเต็ม 199 THB</button>'
    + '</div>';

  var detailTabsShellHtml = '<div class="detail-tabs-card">'
    + '<div class="detail-tabs-head"><div><span>อ่านรายละเอียดพื้นฐาน</span><small>แท็บแรกอ่านฟรี ส่วนแท็บต่อไปคือเนื้อหาลึกสำหรับพรีเมียม จัดเป็นหมวดสั้น ๆ ให้กดง่าย</small></div></div>'
    + '<div class="tabs-w"><div class="tabs" id="tt0"></div></div><div id="ts0"></div>'
    + '</div>';

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
    + conversionRoadmapHtml
    + wrapCollapsible("✦ กำลังวันประจำตัว ✦", "วันเกิด · เทวดา · ธาตุ · สีมงคล", cosmicBriefHtml)
    + wrapCollapsible("✨ พลังงานเสริมดวง", "เลขและสีมงคลประจำวัน", powerCardHtml)
    + wrapCollapsible("✦ สูตรเปิดดวงลาภลอย ✦", "เลขเด็ด หวย ทิศ คาถา สายมู 🔒 Premium", windfallLuckHtml, true)
    + wrapCollapsible("📅 แผนที่ชีวิตรายเดือน", "5 ด้าน พร้อมพรีวิวรายเดือน 🔒 Premium", monthlyLifeMapHtml, true)
    + wrapCollapsible("📊 แผนที่สถานการณ์ชีวิต", "กราฟชีวิต + 6 ด้าน วิเคราะห์สถานการณ์ 🔒 Premium", domainHtml, false)
    + wrapCollapsible("🪞 กระจกกรรม", "บทเรียนและรูปแบบที่ชีวิตพาซ้ำ 🔒 Premium", karmaHtml, true)
    + buildElementRadar(p, r, l)
    + detailTabsShellHtml;

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
    {lb:'ตัวตนฟรี', secs:[
      {t:u.s0[0], c:p.p, rf:refDesc.p_r_l},
      {t:'สไตล์การแสดงออก (ราศีเกิด)', c:rasiHtml, rf:'วิเคราะห์จากราศีเกิด ('+r.n+') ซึ่งเป็นรูปแบบพลังงานที่คุณใช้ขับเคลื่อนตัวเองบนโลกใบนี้'},
      {t:'รหัสผ่านชีวิต (ทักษาปกรณ์)', c:thaksaHtml, rf:refDesc.thaksa},
      {t:u.s0[1], c:p.str, rf:'วิเคราะห์จากพลังงานธาตุ'+p.el+' และลักษณะเด่นของดาว'+p.n}
    ]},
    {lb:'เงาใจ', secs:[
      {t:u.s0[2], c:wkFull, rf:refDesc.wk}
    ]},
    {lb:'ความรัก', secs:[{t:u.s0[3], c:p.lv, rf:refDesc.lv}]},
    {lb:'งานเงิน', secs:[
      {t:u.s0[4], c:p.ca, rf:refDesc.ca},
      {t:u.s0[5], c:p.mn, rf:refDesc.mn}
    ]},
    {lb:'อดีต', secs:[{t:u.s0[6], c:buildLifeTimeline('past', p, ageY, ageM), rf:refDesc.past}]},
    {lb:'ตอนนี้', secs:[{t:u.s0[7], c:buildLifeTimeline('present', p, ageY, ageM), rf:refDesc.pres}]},
    {lb:'อนาคต', secs:[{t:u.s0[8], c:buildLifeTimeline('future', p, ageY, ageM), rf:refDesc.fut}]}
  ];

  buildTabs('tt0','ts0','s0_',TB,p,u);

  // 7. กล่องนัดหมายส่วนตัว (ลิงก์ Inbox ของคุณ)
  var consultHtml = '<div class="private-consult-card">'
    + '<div class="pcc-subtitle">การอ่านส่วนตัวแบบเจาะลึก</div>'
    + '<div class="pcc-title">✦ ปลดล็อกดวงชะตาแบบเจาะลึก ✦</div>'
    + '<div class="pcc-desc">ผลทำนายที่คุณเพิ่งอ่านเป็นเพียงเศษเสี้ยวของจักรวาลในตัวคุณ หากคุณกำลังเผชิญทางแยกของชีวิต หรือต้องการคำแนะนำแบบเจาะลึกเพื่อก้าวข้ามอุปสรรค... ให้ดวงดาวและเราช่วยนำทาง</div>'
    + '<a href="https://m.me/61573341702581" target="_blank" class="pcc-btn">จองคิวปรึกษาส่วนตัว</a>'
    + '</div>';

  if (typeof initCollapsibleSections === 'function') initCollapsibleSections();
  document.getElementById('ts0').insertAdjacentHTML('beforeend',
    '<div class="mc"><div class="mc-l">✦ '+u.mn+' · '+nm+' ✦</div>'
    +'<div class="mc-t">"'+p.man+'"</div></div>'
    + consultHtml
    +'<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="0">'+u.r0+'</button></div>'
  );
}
