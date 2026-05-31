// Auspicious reading renderer v2 (Mode 2)
// Redesigned: "ฤกษ์ยามวันดี" → personalized by birth element × today element
// Replaced: generic คาถา → "เหตุเสริม" from บันไดกุศล 5 ชั้น (พระไตรปิฎก)
// Added: แบบฝึก 7 วัน — practical life exercises

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
  var premiumUnlocked = premiumIsUnlocked();
  var elementEmoji = p.el === 'ไฟ' ? '🔥' : p.el === 'ดิน' ? '🪨' : p.el === 'ลม' ? '💨' : '💧';
  var DN=u.dn;
  var DS=['☉','☽','♂','☿','♃','♀','♄'];
  var DC=['#FFB84D','#C8DCF0','#E8534A','#6EC89A','#F5A623','#E8A0CF','#9B8AB8'];

  // ===== 1. Header Card =====
  var headerHtml = '<div class="ausp-header-card">'
    + '<div class="ahp-planet" style="color:' + p.c + '">' + p.s + '</div>'
    + '<div class="ahp-info">'
    + '<div class="ahp-name">' + nm + ' — ธาตุ' + p.el + ' ' + elementEmoji + '</div>'
    + '<div class="ahp-connection">พลังงานจากดาว' + p.n + ' (' + p.el + ') เสริมจังหวะชีวิตของคุณ</div>'
    + '</div></div>';

  // ===== 2. วันไหนเหมาะทำอะไร (Personalized by element) =====
  // Each day has a "day element" that interacts with the user's birth element
  var DAY_ELEMENTS = ['ไฟ','น้ำ','ไฟ','ลม','ดิน','น้ำ','ดิน']; // Sun=0..Sat=6

  // Interaction ratings: birthElement × dayElement → score
  var ELEMENT_SCORE = {
    'ไฟ':  { 'ไฟ': 90, 'น้ำ': 70, 'ลม': 85, 'ดิน': 80 },
    'น้ำ': { 'ไฟ': 75, 'น้ำ': 85, 'ลม': 80, 'ดิน': 90 },
    'ลม':  { 'ไฟ': 90, 'น้ำ': 80, 'ลม': 75, 'ดิน': 85 },
    'ดิน': { 'ไฟ': 80, 'น้ำ': 90, 'ลม': 75, 'ดิน': 85 }
  };

  // What each day element is best for
  var DAY_GOOD_AT = {
    'ไฟ': { main: 'เริ่มต้นสิ่งใหม่, ตัดสินใจ, แสดงภาวะผู้นำ', sub: 'จุดไฟพลังงาน — วันแห่งการลงมือทำ' },
    'น้ำ': { main: 'ดูแลความสัมพันธ์, รับฟัง, รักษาตัวเอง', sub: 'หล่อเลี้ยงใจ — วันแห่งการเชื่อมโยง' },
    'ลม': { main: 'สื่อสาร, เจรจา, วางแผน, เรียนรู้', sub: 'เปิดรับไอเดีย — วันแห่งความคิดสร้างสรรค์' },
    'ดิน': { main: 'ลงมือทำ, จัดระบบ, ดูแลสุขภาพ', sub: 'สร้างรากฐาน — วันแห่งความมั่นคง' }
  };

  // Cross-element advice
  var CROSS_ADVICE = {
    'ไฟ-น้ำ': 'อารมณ์จะลึก — ใช้ความรู้สึกนำทาง แต่อย่าตัดสินด้วยอารมณ์ชั่ววูบ',
    'ไฟ-ลม': 'ความคิดแล่นเร็ว — จดไว้ก่อนจะลืม แล้วเลือกทำ 1 อย่าง',
    'ไฟ-ดิน': 'พลังนิ่งและมั่นคง — ลงมือทำวันนี้ ผลลัพธ์จะยั่งยืน',
    'น้ำ-ไฟ': 'ความมั่นใจจะมาพร้อมอารมณ์ — ใช้ให้เป็นพลัง',
    'น้ำ-ลม': 'ความคิดจะลึกซึ้ง — เหมาะกับเขียนบันทึกหรือคุยเรื่องสำคัญ',
    'น้ำ-ดิน': 'จิตใจจะสงบ — เหมาะกับจัดการเรื่องที่ค้างคา',
    'ลม-ไฟ': 'แรงบันดาลใจพุ่ง — ลงมือทำทันทีก่อนจะหมดไฟ',
    'ลม-น้ำ': 'ความเห็นอกเห็นใจเพิ่มขึ้น — วันนี้เหมาะรับฟัง',
    'ลม-ดิน': 'ความคิดเป็นระบบ — เหมาะวางแผนและจัดระเบียบ',
    'ดิน-ไฟ': 'ความมุ่งมั่นแข็งแกร่ง — ลุยงานที่ท้าทาย',
    'ดิน-น้ำ': 'ความอ่อนโยนเสริมความมั่นคง — ดูแลคนรอบข้าง',
    'ดิน-ลม': 'การสื่อสารชัดเจน — เจรจาต่อรองจะสำเร็จ'
  };

  // Build personalized day-by-day cards
  var todayIdx = new Date().getDay();
  var todayEl = DAY_ELEMENTS[todayIdx];
  var score = ELEMENT_SCORE[p.el] ? ELEMENT_SCORE[p.el][todayEl] : 80;
  var crossKey = p.el + '-' + todayEl;
  var advice = CROSS_ADVICE[crossKey] || 'วันนี้พลังธาตุสมดุล — ทำตามแผนที่วางไว้ได้เลย';
  var goodAt = DAY_GOOD_AT[todayEl] || DAY_GOOD_AT['ไฟ'];

  var dayCardHtml = '<div class="ausp-today-card">'
    + '<div class="atc-header">'
    + '<div class="atc-title">✦ วันนี้เหมาะทำอะไร ✦</div>'
    + '<div class="atc-subtitle">ธาตุ' + p.el + ' (คุณ) × ธาตุ' + todayEl + ' (วันนี้)</div>'
    + '</div>'
    + '<div class="atc-score">'
    + '<div class="atc-score-bar"><div class="atc-score-fill" style="width:' + score + '%"></div></div>'
    + '<div class="atc-score-text">' + score + '/100 — ' + (score >= 85 ? '✦ วันดีมาก' : score >= 70 ? '◇ วันดี' : '△ วันต้องระวัง') + '</div>'
    + '</div>'
    + '<div class="atc-good-at"><strong>เหมาะกับ:</strong> ' + goodAt.main + '</div>'
    + '<div class="atc-advice">' + advice + '</div>'
    + '<div class="atc-element-tag">' + goodAt.sub + '</div>'
    + '</div>';

  // ===== 3. จังหวะดาวรายสัปดาห์ (Personalized) =====
  var weekHtml = '<div class="ausp-week-card' + (premiumUnlocked ? '' : ' is-locked') + '">'
    + '<div class="awc-title">📅 จังหวะดาวรายสัปดาห์</div>'
    + '<div class="awc-subtitle">วันไหนเหมาะทำอะไร — เฉพาะธาตุ' + p.el + 'ของคุณ</div>';

  if (premiumUnlocked) {
    weekHtml += '<div class="awc-grid">';
    for (var i = 0; i < 7; i++) {
      var dEl = DAY_ELEMENTS[i];
      var dScore = ELEMENT_SCORE[p.el] ? ELEMENT_SCORE[p.el][dEl] : 80;
      var dGood = DAY_GOOD_AT[dEl];
      var lv = dScore >= 85 ? 'good' : dScore >= 70 ? 'mid' : 'bad';
      var lvLabel = lv === 'good' ? '✦ ดีมาก' : lv === 'mid' ? '◇ ดี' : '△ ระวัง';
      var isToday = i === todayIdx;
      weekHtml += '<div class="awc-day' + (isToday ? ' awc-today' : '') + '">'
        + '<div class="awc-day-name">' + DN[i] + '</div>'
        + '<div class="awc-day-symbol" style="color:' + DC[i] + '">' + DS[i] + '</div>'
        + '<div class="awc-day-element">' + dEl + '</div>'
        + '<div class="awc-day-score awc-' + lv + '">' + lvLabel + '</div>'
        + '<div class="awc-day-focus">' + dGood.main.split(',')[0] + '</div>'
        + (isToday ? '<div class="awc-today-badge">วันนี้</div>' : '')
        + '</div>';
    }
    weekHtml += '</div>';
  } else {
    weekHtml += '<div class="awc-preview">'
      + '<div class="awc-day"><div class="awc-day-name">' + DN[todayIdx] + '</div><div class="awc-day-symbol" style="color:' + DC[todayIdx] + '">' + DS[todayIdx] + '</div><div class="awc-day-element">' + todayEl + '</div><div class="awc-day-score awc-' + (score >= 85 ? 'good' : score >= 70 ? 'mid' : 'bad') + '">' + (score >= 85 ? '✦ ดีมาก' : score >= 70 ? '◇ ดี' : '△ ระวัง') + '</div></div>'
      + '<div class="awc-locked-hint">ปลดล็อก Premium เพื่อดูจังหวะดาวครบทั้ง 7 วัน</div>'
      + '</div>';
    weekHtml += buildPremiumLockOverlay('ปลดล็อกจังหวะดาวรายสัปดาห์', 'ดูวันไหนเหมาะทำอะไรครบทั้ง 7 วัน เฉพาะธาตุของคุณ');
  }
  weekHtml += '</div>';

  // ===== 4. เหตุเสริมจากพระไตรปิฎก (แทนคาถา) =====
  // บันไดกุศลเหตุ 5 ชั้น — personalized by element
  var VINAI = {
    'ไฟ': {
      title: '🔥 เหตุเสริมสำหรับธาตุไฟ',
      subtitle: 'เปลี่ยนความร้อนแรงเป็นพลังนำทาง',
      steps: [
        { icon: '🍚', name: 'ทาน', action: 'วันนี้ให้ช่วยใครสักคน 1 เรื่อง ด้วยใจเคารพ — ไม่ต้องใหญ่ แค่จริงใจ', why: 'แก้ความยึดตัวเองเป็นศูนย์กลาง' },
        { icon: '🙏', name: 'ศีล', action: 'ก่อนพูด หยุด 3 ลมหายใจ — ถามว่า "คำนี้จะเพิ่มไฟหรือดับไฟ?"', why: 'ลดคำพูดที่ทำลายใจคน' },
        { icon: '💛', name: 'เมตตา', action: 'แผ่เมตตาให้คนที่ทำให้โกรธ: "ขอให้เขาปลอดภัย เป็นสุข"', why: 'ดับไฟในใจตัวเอง' },
        { icon: '🧠', name: 'ปัญญา', action: 'วันนี้สังเกต 1 อย่างที่เปลี่ยนไปจากเมื่อวาน — เห็นความไม่เที่ยง', why: 'ลดการยึดติดผลลัพธ์' }
      ],
      weekChallenge: '7 วันธาตุไฟ: ทุกเช้าถาม "วันนี้จะใช้พลังสร้าง ไม่ใช่เผา" — จด 1 ประโยคก่อนนอน'
    },
    'น้ำ': {
      title: '💧 เหตุเสริมสำหรับธาตุน้ำ',
      subtitle: 'เปลี่ยนความอ่อนไหวเป็นความเข้าใจ',
      steps: [
        { icon: '🍚', name: 'ทาน', action: 'ให้เวลาคนที่ต้องการคนรับฟัง 15 นาที — แค่ฟัง ไม่ต้องแก้', why: 'ใช้ความอ่อนไหวเป็นพลัง' },
        { icon: '🙏', name: 'ศีล', action: 'วันนี้พูดจริง 1 เรื่องที่เคยหลีกเลี่ยง — ด้วยน้ำเสียงอ่อนโยน', why: 'ลดการเก็บกดจนป่วย' },
        { icon: '💛', name: 'เมตตา', action: 'แผ่เมตตาให้ตัวเอง: "ขอให้ฉันปลอดภัย ไม่ต้องแบกทุกอย่าง"', why: 'หยุดรับอารมณ์คนอื่นมาแบก' },
        { icon: '🧠', name: 'ปัญญา', action: 'เมื่อรู้สึกท่วมท้น ถาม: "สิ่งนี้เที่ยงไหม? อยู่กับเราตลอดไหม?"', why: 'เห็นว่าอารมณ์เกิดดับได้' }
      ],
      weekChallenge: '7 วันธาตุน้ำ: ทุกคืนเขียน "วันนี้ปล่อยวางอะไรได้ 1 อย่าง" — ไม่ต้องแก้ แค่ปล่อย'
    },
    'ลม': {
      title: '💨 เหตุเสริมสำหรับธาตุลม',
      subtitle: 'เปลี่ยนความคิดกระจายเป็นปัญญาคมชัด',
      steps: [
        { icon: '🍚', name: 'ทาน', action: 'แบ่งปันความรู้หรือไอเดีย 1 อย่างให้คนที่ต้องการ — ให้ฟรี', why: 'ใช้ปัญญาเป็นทาน' },
        { icon: '🙏', name: 'ศีล', action: 'เลือกงานสำคัญ 1 ชิ้น ทำให้จบก่อนเริ่มใหม่ — ห้ามกระจาย', why: 'แก้นิสัยเริ่มไม่จบ' },
        { icon: '💛', name: 'เมตตา', action: 'ก่อนตอบโต้ เว้น 1 ลมหายใจ ถาม "คำนี้จะสร้างสะพานหรือกำแพง?"', why: 'ลดคำพูดที่เร็วเกินไป' },
        { icon: '🧠', name: 'ปัญญา', action: '3 นาที นั่งนิ่ง ดูลมหายใจ — ไม่ต้องคิดอะไร แค่รู้', why: 'ฝึกโฟกัสจิตที่กระจาย' }
      ],
      weekChallenge: '7 วันธาตุลม: เลือก 1 เป้าหมาย ทำให้คืบหน้าทุกวัน — ปิดสิ่งรบกวนวันละ 45 นาที'
    },
    'ดิน': {
      title: '🪨 เหตุเสริมสำหรับธาตุดิน',
      subtitle: 'เปลี่ยนความแข็งแกร่งเป็นความยืดหยุ่น',
      steps: [
        { icon: '🍚', name: 'ทาน', action: 'มอบหมายงาน 1 อย่างที่เคยแบกคนเดียว — ให้คนอื่นช่วย', why: 'แก้การแบกทุกอย่างไว้เอง' },
        { icon: '🙏', name: 'ศีล', action: 'นอนให้พอ 1 คืน — ร่างกายคือรากฐานที่ต้องดูแล', why: 'หยุดทำร้ายกายด้วยงาน' },
        { icon: '💛', name: 'เมตตา', action: 'ชม/ขอบคุณคนใกล้ตัว 1 คน อย่างจริงใจวันนี้', why: 'แสดงความรักก่อนที่จะสาย' },
        { icon: '🧠', name: 'ปัญญา', action: 'ถามตัวเอง: "สิ่งที่กลัวอยู่ เกิดขึ้นจริงกี่ครั้ง?" — เห็นความไม่เที่ยงของความกลัว', why: 'ลดความกังวลที่ไม่จำเป็น' }
      ],
      weekChallenge: '7 วันธาตุดิน: ทุกวันเลือก 1 ภาระที่ไม่จำเป็นต้องทำคนเดียว — มอบหมายหรือปล่อย'
    }
  };

  var vinai = VINAI[p.el] || VINAI['ไฟ'];
  var vinaiHtml = '<div class="ausp-vinai-card">'
    + '<div class="avc-header">'
    + '<div class="avc-title">' + vinai.title + '</div>'
    + '<div class="avc-subtitle">' + vinai.subtitle + '</div>'
    + '</div>';

  vinai.steps.forEach(function(step) {
    vinaiHtml += '<div class="avc-step">'
      + '<div class="avc-step-icon">' + step.icon + '</div>'
      + '<div class="avc-step-content">'
      + '<div class="avc-step-name">' + step.name + '</div>'
      + '<div class="avc-step-action">' + step.action + '</div>'
      + '<div class="avc-step-why">เหตุผล: ' + step.why + '</div>'
      + '</div></div>';
  });

  vinaiHtml += '<div class="avc-challenge">'
    + '<div class="avc-challenge-title">🎯 แบบฝึก 7 วัน</div>'
    + '<div class="avc-challenge-text">' + vinai.weekChallenge + '</div>'
    + '</div>'
    + '<div class="avc-ref">หลักจากพระไตรปิฎก: บันไดกุศลเหตุ 5 ชั้น — ทาน → ศีล → เมตตา → ปัญญา</div>'
    + '</div>';

  // ===== 5. วันมงคลสี (Keep existing but personalized) =====
  var TODAY_COLORS = [
    { d: 'อาทิตย์', luck: '#4CAF50', luckN: 'เขียว (รับทรัพย์)', work: '#9C27B0', workN: 'ม่วง (ผู้ใหญ่เอ็นดู)', bad: '#2196F3', badN: 'ฟ้า/น้ำเงิน (เลี่ยง)' },
    { d: 'จันทร์', luck: '#9C27B0', luckN: 'ม่วง (รับทรัพย์)', work: '#FF9800', workN: 'ส้ม (ผู้ใหญ่เอ็นดู)', bad: '#F44336', badN: 'แดง (เลี่ยง)' },
    { d: 'อังคาร', luck: '#FF9800', luckN: 'ส้ม (รับทรัพย์)', work: '#424242', workN: 'เทา/ดำ (ผู้ใหญ่เอ็นดู)', bad: '#FFFFFF', badN: 'ขาว/เหลือง (เลี่ยง)' },
    { d: 'พุธ', luck: '#424242', luckN: 'เทา/ดำ (รับทรัพย์)', work: '#2196F3', workN: 'ฟ้า/น้ำเงิน (ผู้ใหญ่เอ็นดู)', bad: '#E91E63', badN: 'ชมพู (เลี่ยง)' },
    { d: 'พฤหัสบดี', luck: '#F44336', luckN: 'แดง (รับทรัพย์)', work: '#FFFFFF', workN: 'ขาว/ครีม (ผู้ใหญ่เอ็นดู)', bad: '#9C27B0', badN: 'ม่วง (เลี่ยง)' },
    { d: 'ศุกร์', luck: '#E91E63', luckN: 'ชมพู (รับทรัพย์)', work: '#4CAF50', workN: 'เขียว (ผู้ใหญ่เอ็นดู)', bad: '#424242', badN: 'เทา/ดำ (เลี่ยง)' },
    { d: 'เสาร์', luck: '#2196F3', luckN: 'ฟ้า/น้ำเงิน (รับทรัพย์)', work: '#F44336', workN: 'แดง (ผู้ใหญ่เอ็นดู)', bad: '#4CAF50', badN: 'เขียว (เลี่ยง)' }
  ];
  var tc = TODAY_COLORS[todayIdx];
  var colorHtml = '<div class="wellness-card">'
    + '<div class="wc-title"><span style="font-size:16px;">✨</span> พลังงานสีประจำวันนี้ (วัน' + tc.d + ')</div>'
    + '<div class="color-day">'
    + '<div class="cd-row">'
    + '<div class="cd-item"><div class="cd-dot" style="background:' + tc.luck + ';"></div><div class="cd-lbl" style="color:var(--g);">' + tc.luckN + '</div></div>'
    + '<div class="cd-item"><div class="cd-dot" style="background:' + tc.work + ';"></div><div class="cd-lbl" style="color:var(--g);">' + tc.workN + '</div></div>'
    + '<div class="cd-item"><div class="cd-dot" style="background:' + tc.bad + '; border-color:rgba(255,0,0,0.4);"></div><div class="cd-lbl" style="color:#c06080">' + tc.badN + '</div></div>'
    + '</div>'
    + '</div></div>';

  // ===== 6. Cosmic Routine (keep existing) =====
  var routines = {
    'ไฟ': [
      { t: '06:00 - 08:00', d: '<strong>Ignite (ปลุกพลัง):</strong> ออกกำลังกายเรียกเหงื่อ หรือตั้งเป้าหมาย 3 อย่างที่ต้องทำให้สำเร็จในวันนี้' },
      { t: '09:00 - 14:00', d: '<strong>Blaze (ลุยงาน):</strong> ช่วงพลังสูงสุด! จัดการงานที่ยากที่สุดหรือต้องใช้ความกล้าหาญ' },
      { t: '15:00 - 17:00', d: '<strong>Radiate (กระจายแสง):</strong> ประชุมทีม สื่อสารสร้างเครือข่าย หรือให้ความช่วยเหลือคนรอบข้าง' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Ember (พักฟื้น):</strong> ลดการใช้หน้าจอ อาบน้ำอุ่น ปล่อยให้ความใจร้อนค่อยๆ สงบลง' }
    ],
    'ดิน': [
      { t: '06:00 - 08:00', d: '<strong>Ground (ตั้งหลัก):</strong> ยืดเหยียดร่างกาย ดื่มน้ำเปล่า จัดลำดับงานอย่างช้าๆ' },
      { t: '09:00 - 15:00', d: '<strong>Build (สร้างสรรค์):</strong> ช่วง Deep Work ทำงานที่ต้องใช้สมาธิและความละเอียดรอบคอบสูง' },
      { t: '16:00 - 18:00', d: '<strong>Organize (จัดระเบียบ):</strong> สะสางอีเมล จัดโต๊ะทำงาน หรือวางแผนสำหรับวันพรุ่งนี้' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Settle (สงบใจ):</strong> ทานอาหารมื้ออร่อย อยู่กับคนที่รัก คลายกล้ามเนื้อที่ตึงเครียด' }
    ],
    'ลม': [
      { t: '06:00 - 08:00', d: '<strong>Breathe (เปิดรับ):</strong> อ่านบทความ ฟังพอดแคสต์ หรือเขียน Journal ระบายความคิด' },
      { t: '09:00 - 12:00', d: '<strong>Flow (ลื่นไหล):</strong> ระดมสมอง คิดงานครีเอทีฟ หรือเริ่มเรียนรู้สิ่งใหม่' },
      { t: '13:00 - 16:00', d: '<strong>Connect (เชื่อมโยง):</strong> นัดหมายลูกค้า นำเสนองาน หรือแลกเปลี่ยนไอเดีย' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Still (หยุดนิ่ง):</strong> งดรับข้อมูล ฝึกสมาธิ ทำกิจกรรมที่ต้องโฟกัสสิ่งเดียว' }
    ],
    'น้ำ': [
      { t: '06:00 - 08:00', d: '<strong>Reflect (สะท้อนใจ):</strong> นั่งสมาธิ ฟังเพลงบรรเลง เช็กความรู้สึกก่อนเริ่มวัน' },
      { t: '09:00 - 12:00', d: '<strong>Nurture (ดูแล):</strong> ทำงานที่ต้องใช้ความเห็นอกเห็นใจ ดูแลลูกค้า หรือซัพพอร์ตทีม' },
      { t: '13:00 - 16:00', d: '<strong>Create (สร้างผลงาน):</strong> ใช้สัญชาตญาณและอารมณ์ศิลป์สร้างสรรค์ผลงาน' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Cleanse (ชำระล้าง):</strong> แช่น้ำอุ่น เขียนบันทึกขอบคุณ ปล่อยวางความรู้สึกที่แบกรับมา' }
    ]
  };
  var myRoutine = routines[p.el];
  var routineHtml = '<div class="wellness-card cosmic-routine-card' + (premiumUnlocked ? '' : ' is-locked') + '">'
    + '<div class="wc-title"><span style="font-size:16px;">⏳</span> นาฬิกาชีวิตธาตุ' + p.el + ' (Cosmic Routine)</div>'
    + '<div style="font-size:11.5px; color:var(--tx2); margin-bottom:16px; text-align:center; line-height:1.6;">ตารางเวลาที่สอดคล้องกับพลังงานดวงดาวของคุณ</div>';
  if (premiumUnlocked) {
    myRoutine.forEach(function(rt){
      routineHtml += '<div class="time-block"><div class="tb-time">' + rt.t + '</div><div class="tb-desc">' + rt.d + '</div></div>';
    });
  } else {
    routineHtml += '<div class="time-block"><div class="tb-time">Premium</div><div class="tb-desc">ปลดล็อกเพื่อดูตารางนาฬิกาชีวิตรายช่วงเวลา</div></div>'
      + buildPremiumLockOverlay('ปลดล็อก Cosmic Routine', 'ดูตารางชีวิตตามธาตุ ช่วงเวลาพลังสูง และช่วงเวลาพักฟื้น');
  }
  routineHtml += '</div>';

  // ===== 7. Opening Mantra (rewritten) =====
  var mantraHtml = '<div class="mc"><div class="mc-l">✦ คำนำทาง ✦</div>'
    + '<div class="mc-t" style="font-size:13px; line-height:1.9; font-weight:normal;">'
    + '"ชีวิตดีขึ้นได้ด้วยการสร้างเหตุใหม่ที่ตรงข้ามกับทุกข์ — เริ่มจากทานที่มีใจดี ศีลที่ทำให้ชีวิตปลอดภัย เมตตาที่ทำให้ใจเย็น และปัญญาที่เห็นความไม่เที่ยงของทุกสิ่ง"'
    + '<div style="font-size:10px;color:#7a6a9a;margin-top:6px;letter-spacing:.04em;">— หลักจากพระไตรปิฎก</div>'
    + '</div></div>';

  // ===== Render all =====
  wrap.innerHTML = headerHtml
    + dayCardHtml
    + weekHtml
    + vinaiHtml
    + colorHtml
    + routineHtml
    + mantraHtml
    + '<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="2">' + u.r2 + '</button></div>';
}

// Max date
['d0','d1a','d1b','d2'].forEach(function(id){
  var el=document.getElementById(id);
  if(el) el.max=new Date().toISOString().split('T')[0];
});
